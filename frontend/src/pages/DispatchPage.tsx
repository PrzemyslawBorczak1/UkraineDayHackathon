import { useEffect, useMemo, useState } from "react";
import { CtaPill } from "../components/ui";
import { DispatchShell } from "../components/layout/DispatchShell";
import { MissionMap } from "../components/map/MissionMap";
import { WarehouseLayer } from "../components/map/WarehouseLayer";
import { MissionTimelineLayer } from "../components/map/MissionTimelineLayer";
import { CrisisLayer } from "../components/map/CrisisLayer";
import { TimelineBar } from "../components/timeline/TimelineBar";
import { LeftSidebar } from "../components/sidebar/LeftSidebar";
import { RightSidebar } from "../components/sidebar/RightSidebar";
import { NAV_ENTRIES } from "../data/dispatch";
import { useWarehouses } from "../hooks/useWarehouses";
import { useMissions } from "../hooks/useMissions";
import { useMissionAnimations } from "../hooks/useMissionAnimations";
import { useCrisis } from "../hooks/useCrisis";
import {
  applyFilters,
  buildCarrierColors,
  emptyFilters,
  type FacetKey,
} from "../lib/warehouses";
import {
  applyMissionFilters,
  emptyMissionFilters,
  type MissionFacetKey,
} from "../lib/missions";
import {
  applyCrisisFilters,
  emptyCrisisFilters,
  type CrisisFacetKey,
} from "../lib/crisis";
import { progressOf } from "../lib/geo";

// Wall-clock seconds it takes to play the whole timeline window start → end.
const PLAYBACK_SECONDS = 30;

/**
 * KORD dispatch view: left rail (missions/warehouses + filters), central map
 * stage with floating controls, and right rail (detail).
 *
 * Missions share one timeline window. Each mission starts and ends at its own
 * time inside that window, so as the cursor moves, routes appear when a mission
 * begins, the vehicles drive along, and they disappear once it's delivered.
 */
export function DispatchPage({
  onNewMission,
  onSummary,
}: {
  onNewMission: () => void;
  onSummary: () => void;
}) {
  const [activeNav, setActiveNav] = useState(NAV_ENTRIES[0]?.id);

  // ── Warehouses ──
  const { data: warehouses, loading: whLoading, error: whError } = useWarehouses();
  const [filters, setFilters] = useState(emptyFilters);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);

  const toggleFilter = (facet: FacetKey, value: string) =>
    setFilters((prev) => {
      const next = new Set(prev[facet]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...prev, [facet]: next };
    });

  const filteredWarehouses = useMemo(() => applyFilters(warehouses, filters), [warehouses, filters]);
  const warehouseCarrierColors = useMemo(() => buildCarrierColors(warehouses), [warehouses]);

  // ── Missions ──
  const { data: missions, loading: msLoading, error: msError } = useMissions();
  const animations = useMissionAnimations();
  const [missionFilters, setMissionFilters] = useState(emptyMissionFilters);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);

  const toggleMissionFilter = (facet: MissionFacetKey, value: string) =>
    setMissionFilters((prev) => {
      const next = new Set(prev[facet]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...prev, [facet]: next };
    });

  const filteredMissions = useMemo(
    () => applyMissionFilters(missions, missionFilters),
    [missions, missionFilters]
  );
  const missionCarrierColors = useMemo(() => buildCarrierColors(missions), [missions]);

  // ── Crisis ──
  const { data: crisis, loading: crLoading, error: crError } = useCrisis();
  const [crisisFilters, setCrisisFilters] = useState(emptyCrisisFilters);
  const [selectedCrisisId, setSelectedCrisisId] = useState<string | null>(null);

  const toggleCrisisFilter = (facet: CrisisFacetKey, value: string) =>
    setCrisisFilters((prev) => {
      const next = new Set(prev[facet]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...prev, [facet]: next };
    });

  const filteredCrisis = useMemo(() => applyCrisisFilters(crisis, crisisFilters), [crisis, crisisFilters]);

  // Only animate missions that pass the current filters.
  const visibleAnimations = useMemo(() => {
    const ids = new Set(filteredMissions.map((m) => m.id));
    return animations.filter((a) => ids.has(a.id));
  }, [animations, filteredMissions]);

  // ── Timeline window = span covering every visible mission ──
  const window = useMemo(() => {
    if (visibleAnimations.length === 0) return null;
    let min = Infinity;
    let max = -Infinity;
    for (const a of visibleAnimations) {
      min = Math.min(min, Date.parse(a.start));
      max = Math.max(max, Date.parse(a.end));
    }
    return { start: new Date(min), end: new Date(max) };
  }, [visibleAnimations]);

  const [cursor, setCursor] = useState<Date | null>(null);
  const [playing, setPlaying] = useState(false);

  // Seed / clamp the cursor whenever the window changes.
  useEffect(() => {
    if (!window) return;
    setCursor((prev) => {
      if (!prev) return window.start;
      const ms = prev.getTime();
      if (ms < window.start.getTime() || ms > window.end.getTime()) return window.start;
      return prev;
    });
  }, [window]);

  // Auto-advance the cursor while playing (rAF for smooth motion).
  useEffect(() => {
    if (!playing || !window) return;
    const span = window.end.getTime() - window.start.getTime();
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setCursor((prev) => {
        const base = prev ?? window.start;
        const nextMs = base.getTime() + (span * dt) / (PLAYBACK_SECONDS * 1000);
        if (nextMs >= window.end.getTime()) {
          setPlaying(false);
          return window.end;
        }
        return new Date(nextMs);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, window]);

  const showWarehouses = activeNav === "warehouses";
  const showMissions = activeNav === "tasks";
  const showCrisis = activeNav === "crisis";
  const selectedWhCarrierId = warehouses.find((w) => w.id === selectedWarehouseId)?.carrier_id;

  // Selected mission detail for the right rail (progress vs. the shared cursor).
  const selectedMission = animations.find((a) => a.id === selectedMissionId) ?? null;
  const selectedProgress =
    selectedMission && cursor
      ? progressOf(Date.parse(selectedMission.start), Date.parse(selectedMission.end), cursor.getTime())
      : 0;
  const selectedMissionColor = selectedMission
    ? missionCarrierColors.get(selectedMission.carrier_id)
    : undefined;

  return (
    <DispatchShell
      left={
        <LeftSidebar
          activeNav={activeNav}
          onNavChange={setActiveNav}
          warehouses={warehouses}
          warehousesLoading={whLoading}
          warehousesError={whError}
          filters={filters}
          onToggleFilter={toggleFilter}
          filteredWarehouses={filteredWarehouses}
          warehouseCarrierColors={warehouseCarrierColors}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={setSelectedWarehouseId}
          missions={missions}
          missionsLoading={msLoading}
          missionsError={msError}
          missionFilters={missionFilters}
          onToggleMissionFilter={toggleMissionFilter}
          filteredMissions={filteredMissions}
          missionCarrierColors={missionCarrierColors}
          selectedMissionId={selectedMissionId}
          onSelectMission={setSelectedMissionId}
          crisis={crisis}
          crisisLoading={crLoading}
          crisisError={crError}
          crisisFilters={crisisFilters}
          onToggleCrisisFilter={toggleCrisisFilter}
          filteredCrisis={filteredCrisis}
          selectedCrisisId={selectedCrisisId}
          onSelectCrisis={setSelectedCrisisId}
        />
      }
      right={
        <RightSidebar
          warehouseId={showWarehouses ? selectedWarehouseId : null}
          carrierColor={selectedWhCarrierId ? warehouseCarrierColors.get(selectedWhCarrierId) : undefined}
          mission={showMissions ? selectedMission : null}
          missionProgress={selectedProgress}
          missionCursor={cursor ?? undefined}
          missionColor={selectedMissionColor}
        />
      }
    >
      {/* Map fills the stage. */}
      <div className="absolute inset-0">
        <MissionMap>
          {showWarehouses && (
            <WarehouseLayer
              warehouses={filteredWarehouses}
              colors={warehouseCarrierColors}
              selectedId={selectedWarehouseId}
              onSelect={setSelectedWarehouseId}
            />
          )}
          {showMissions && cursor && (
            <MissionTimelineLayer
              animations={visibleAnimations}
              cursorMs={cursor.getTime()}
              colors={missionCarrierColors}
              selectedId={selectedMissionId}
              onSelect={setSelectedMissionId}
            />
          )}
          {showCrisis && (
            <CrisisLayer
              objects={filteredCrisis}
              selectedId={selectedCrisisId}
              onSelect={setSelectedCrisisId}
            />
          )}
        </MissionMap>
      </div>

      {/* Floating control layer — top bar. */}
      <div className="absolute top-4 left-4 right-4 z-500 pointer-events-none flex items-start justify-between gap-4">
        {/* Left cluster: timeline window. */}
        <div className="pointer-events-auto">
          {showMissions && window && cursor ? (
            <TimelineBar
              value={window}
              cursor={cursor}
              onCursorChange={(d) => {
                setCursor(d);
                setPlaying(false);
              }}
              playing={playing}
              onPlayToggle={() => setPlaying((p) => !p)}
            />
          ) : (
            <TimelineBar />
          )}
        </div>

        {/* Right cluster: stacked actions. */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <CtaPill variant="ghost" onClick={onNewMission}>+ New mission</CtaPill>
          <CtaPill onClick={onSummary}>Summary →</CtaPill>
        </div>
      </div>
    </DispatchShell>
  );
}
