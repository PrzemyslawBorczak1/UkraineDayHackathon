import { useMemo, useState } from "react";
import { CtaPill } from "../components/ui";
import { DispatchShell } from "../components/layout/DispatchShell";
import { MissionMap } from "../components/map/MissionMap";
import { WarehouseLayer } from "../components/map/WarehouseLayer";
import { TimelineBar } from "../components/timeline/TimelineBar";
import { LeftSidebar } from "../components/sidebar/LeftSidebar";
import { RightSidebar } from "../components/sidebar/RightSidebar";
import { NAV_ENTRIES } from "../data/dispatch";
import { useWarehouses } from "../hooks/useWarehouses";
import {
  applyFilters,
  buildCarrierColors,
  emptyFilters,
  type FacetKey,
} from "../lib/warehouses";

/**
 * KORD dispatch view: left rail (tasks/filters), central map stage with
 * floating controls, and right rail (mission detail).
 *
 * The active nav entry drives what the rail lists *and* what the map renders —
 * e.g. picking "Warehouses" plots every (filtered) warehouse, colored by carrier.
 *
 * Floating overlays live in a `pointer-events-none` layer so the map stays
 * draggable; interactive pills opt back in with `pointer-events-auto`.
 */
export function DispatchPage({ onNewMission }: { onNewMission: () => void }) {
  const [activeNav, setActiveNav] = useState(NAV_ENTRIES[0]?.id);
  const { data: warehouses, loading, error } = useWarehouses();
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
  // Colors are derived from the full set so they stay stable as filters change.
  const carrierColors = useMemo(() => buildCarrierColors(warehouses), [warehouses]);
  const showWarehouses = activeNav === "warehouses";
  const selectedCarrierId = warehouses.find((w) => w.id === selectedWarehouseId)?.carrier_id;

  return (
    <DispatchShell
      left={
        <LeftSidebar
          activeNav={activeNav}
          onNavChange={setActiveNav}
          warehouses={warehouses}
          warehousesLoading={loading}
          warehousesError={error}
          filters={filters}
          onToggleFilter={toggleFilter}
          filteredWarehouses={filteredWarehouses}
          carrierColors={carrierColors}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={setSelectedWarehouseId}
        />
      }
      right={
        <RightSidebar
          warehouseId={showWarehouses ? selectedWarehouseId : null}
          carrierColor={selectedCarrierId ? carrierColors.get(selectedCarrierId) : undefined}
        />
      }
    >
      {/* Map fills the stage. */}
      <div className="absolute inset-0">
        <MissionMap>
          {showWarehouses && (
            <WarehouseLayer
              warehouses={filteredWarehouses}
              colors={carrierColors}
              selectedId={selectedWarehouseId}
              onSelect={setSelectedWarehouseId}
            />
          )}
        </MissionMap>
      </div>

      {/* Floating control layer — top bar. */}
      <div className="absolute top-4 left-4 right-4 z-500 pointer-events-none flex items-start justify-between gap-4">
        {/* Left cluster: timeline window. */}
        <div className="pointer-events-auto">
          <TimelineBar />
        </div>

        {/* Right cluster: stacked actions. */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <CtaPill variant="ghost" onClick={onNewMission}>+ New mission</CtaPill>
          <CtaPill>Summary →</CtaPill>
        </div>
      </div>
    </DispatchShell>
  );
}
