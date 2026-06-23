import { memo, type ReactNode } from "react";
import { Badge, CtaPill, SectionLabel, TruckGlyph, cx } from "../ui";
import type { BadgeTone } from "../ui";
import type { MissionAnimation, MissionProposition, MissionPropositionView } from "../../types";
import { useWarehouseDetail } from "../../hooks/useWarehouseDetail";
import { formatStamp } from "../../lib/time";

/** Priority string → badge tone. */
function priorityTone(priority: string): BadgeTone {
  const p = priority.toLowerCase();
  if (p.includes("critical")) return "rose";
  if (p.includes("high")) return "amber";
  if (p.includes("medium")) return "sky";
  return "neutral";
}

/** Right rail: AI-recommended missions; clicking one opens the create form prefilled. */
function PropositionsPanel({
  views,
  loading,
  error,
  onRefresh,
  onSelect,
}: {
  views: MissionPropositionView[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onSelect: (p: MissionProposition) => void;
}) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-6 pt-6 flex items-center justify-between">
        <div>
          <SectionLabel>AI suggestions</SectionLabel>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">Mission propositions</h2>
        </div>
        <CtaPill variant="ghost" onClick={onRefresh} className={loading ? "opacity-50 pointer-events-none" : ""}>
          {loading ? "Generating…" : "Refresh"}
        </CtaPill>
      </div>

      <p className="px-6 mt-2 text-[11px] text-neutral-500">
        Click a proposition to open the New Mission form prefilled with its data.
      </p>

      <div className="flex-1 px-4 mt-4 pb-6 space-y-2">
        {loading ? (
          <p className="px-2 py-3 text-[11px] text-neutral-400">Asking the planner for suggestions…</p>
        ) : error ? (
          <p className="px-2 py-3 text-[11px] text-rose-500">{error}</p>
        ) : views.length === 0 ? (
          <p className="px-2 py-3 text-[11px] text-neutral-400">No propositions yet. Hit Refresh.</p>
        ) : (
          views.map((v, i) => (
            <button
              key={`${v.proposition.origin_id}-${v.proposition.destination_id}-${i}`}
              onClick={() => onSelect(v.proposition)}
              className="w-full text-left rounded-xl ring-1 ring-black/5 px-4 py-3 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold truncate">{v.proposition.proponowany_typ_ladunku}</span>
                <Badge tone={priorityTone(v.proposition.priorytet)}>{v.proposition.priorytet}</Badge>
              </div>
              <div className="mt-1 text-[11px] text-neutral-600 truncate">
                {v.originName} → {v.destName}
              </div>
              <div className="mt-1 text-[10px] text-neutral-400 tabular-nums">
                {v.proposition.wymagany_typ_pojazdu} · {Math.round(v.proposition.szacowany_dystans_km)} km
              </div>
              <p className="mt-2 text-[11px] text-neutral-500 line-clamp-3">{v.proposition.uzasadnienie}</p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/** Origin/destination row with a colored leading dot. */
const RoutePoint = memo(function RoutePoint({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "origin" | "destination";
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={cx(
          "mt-1 size-3 rounded-full shrink-0",
          tone === "origin" ? "bg-neutral-900" : "bg-emerald-500"
        )}
      />
      <div>
        <SectionLabel>{label}</SectionLabel>
        <div className="mt-0.5 text-sm font-medium">{value}</div>
      </div>
    </div>
  );
});

/** A label/value stat row. */
const Stat = memo(function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-neutral-50 ring-1 ring-black/5 px-4 py-3">
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-1 text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
});

/** Availability/status → badge tone. */
function statusTone(status: string): BadgeTone {
  const s = status.toLowerCase();
  if (s.includes("transit") || s.includes("available") || s.includes("active")) return "emerald";
  if (s.includes("scheduled") || s.includes("limited") || s.includes("partial")) return "amber";
  if (s.includes("full") || s.includes("delayed") || s.includes("unavailable") || s.includes("closed"))
    return "rose";
  return "neutral";
}

// ── Mission panel ────────────────────────────────────────────────────────────

/** Right rail: selected mission, with the live playback position. */
function MissionPanel({
  mission,
  progress,
  cursor,
  color,
}: {
  mission: MissionAnimation;
  progress: number;
  cursor: Date;
  color: string;
}) {
  const start = new Date(mission.start);
  const end = new Date(mission.end);
  const pct = Math.round(progress * 100);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-6 pt-6">
        <div className="flex items-center justify-between">
          <SectionLabel>Mission · {mission.id}</SectionLabel>
          <Badge tone={statusTone(mission.status)}>{mission.status}</Badge>
        </div>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">{mission.cargo_type}</h2>
        <p className="mt-1 text-[11px] text-neutral-500 tabular-nums">
          {mission.origin_point} → {mission.destination_point} · {mission.priority}
        </p>
      </div>

      {/* Playback window */}
      <div className="mx-6 mt-5 rounded-xl bg-neutral-50 ring-1 ring-black/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <SectionLabel>Progress</SectionLabel>
          <span className="text-[11px] tabular-nums text-neutral-500">{pct}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-200 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] tabular-nums text-neutral-400">
          <span>{formatStamp(start)}</span>
          <span className="text-neutral-600">{formatStamp(cursor)}</span>
          <span>{formatStamp(end)}</span>
        </div>
      </div>

      {/* Route */}
      <div className="px-6 mt-6 space-y-4">
        <SectionLabel>Route</SectionLabel>
        <RoutePoint label="Origin" value={mission.origin_point} tone="origin" />
        <RoutePoint label="Destination" value={mission.destination_point} tone="destination" />
      </div>

      {/* Carrier + cargo */}
      <div className="px-6 mt-6 grid grid-cols-2 gap-2">
        <Stat label="Cargo" value={mission.cargo_type} />
        <Stat label="Vehicles" value={mission.vehicles.length} />
      </div>
      <div className="px-6 mt-2">
        <div className="flex items-center gap-3 rounded-xl ring-1 ring-black/5 px-4 py-3">
          <span className="size-3 shrink-0 rounded-full" style={{ background: color }} />
          <div className="text-sm font-medium">{mission.carrier_name}</div>
          <div className="text-[11px] text-neutral-400 tabular-nums ml-auto">{mission.carrier_id}</div>
        </div>
      </div>

      {/* Vehicles */}
      <div className="px-6 mt-6 pb-6 space-y-2">
        <SectionLabel>Vehicles en route</SectionLabel>
        <div className="space-y-2">
          {mission.vehicles.map((v) => (
            <div key={v.id} className="flex items-center gap-3 rounded-xl ring-1 ring-black/5 px-4 py-3">
              <div className="size-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400">
                <TruckGlyph />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold tabular-nums">{v.id}</div>
                <div className="text-[11px] text-neutral-500 truncate">{v.vehicle_type}</div>
              </div>
              <span className="text-[11px] tabular-nums text-neutral-500">{pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Warehouse panel ──────────────────────────────────────────────────────────

/** Right rail: full detail for the selected warehouse, fetched by id. */
function WarehouseDetailPanel({ id, carrierColor }: { id: string; carrierColor?: string }) {
  const { data: w, loading, error } = useWarehouseDetail(id);

  if (loading) {
    return <div className="px-6 pt-6 text-[11px] text-neutral-400">Loading warehouse…</div>;
  }
  if (error) {
    return <div className="px-6 pt-6 text-[11px] text-rose-500">{error}</div>;
  }
  if (!w) return null;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-6 pt-6">
        <div className="flex items-center justify-between">
          <SectionLabel>Warehouse · {w.id}</SectionLabel>
          <Badge tone={statusTone(w.availability_status)}>{w.availability_status}</Badge>
        </div>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">{w.name}</h2>
        <p className="mt-1 text-[11px] text-neutral-500 tabular-nums">
          {w.city} · {w.voivodeship} · {w.warehouse_type}
        </p>
      </div>

      {/* Capacity */}
      <div className="mx-6 mt-5 rounded-xl bg-neutral-50 ring-1 ring-black/5 px-4 py-3">
        <SectionLabel>Available capacity</SectionLabel>
        <div className="mt-1 text-2xl font-semibold tabular-nums">{w.available_capacity_pct}%</div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-200 overflow-hidden">
          <div className="h-full rounded-full bg-neutral-900" style={{ width: `${w.available_capacity_pct}%` }} />
        </div>
      </div>

      {/* Facility stats */}
      <div className="px-6 mt-6">
        <SectionLabel>Facility</SectionLabel>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Stat label="Area" value={`${w.area_m2.toLocaleString()} m²`} />
          <Stat label="Dock doors" value={w.dock_doors} />
          <Stat label="Operating hours" value={w.operating_hours} />
          <Stat label="Activation" value={`${w.activation_time_hours} h`} />
          <Stat label="Cold storage" value={w.cold_storage ? "Yes" : "No"} />
          <Stat label="On-site security" value={w.on_site_security ? "Yes" : "No"} />
        </div>
      </div>

      {/* Carrier */}
      <div className="px-6 mt-6">
        <SectionLabel>Carrier</SectionLabel>
        <div className="mt-2 flex items-center gap-3 rounded-xl ring-1 ring-black/5 px-4 py-3">
          <span className="size-3 shrink-0 rounded-full" style={{ background: carrierColor ?? "#525252" }} />
          <div className="text-sm font-medium tabular-nums">{w.carrier_id}</div>
        </div>
      </div>

      {/* Location */}
      <div className="px-6 mt-6 pb-6">
        <SectionLabel>Coordinates</SectionLabel>
        <div className="mt-2 rounded-xl ring-1 ring-black/5 px-4 py-3 text-[11px] text-neutral-500 tabular-nums">
          {w.geom.lat.toFixed(4)}, {w.geom.lng.toFixed(4)}
        </div>
      </div>
    </div>
  );
}

/**
 * Right rail: warehouse detail or mission detail depending on what's selected;
 * renders nothing when neither is.
 */
export function RightSidebar({
  warehouseId,
  carrierColor,
  mission,
  missionProgress = 0,
  missionCursor,
  missionColor = "#6366f1",
  propositions,
  propositionsLoading = false,
  propositionsError = null,
  onRefreshPropositions,
  onSelectProposition,
}: {
  warehouseId?: string | null;
  carrierColor?: string;
  mission?: MissionAnimation | null;
  missionProgress?: number;
  missionCursor?: Date;
  missionColor?: string;
  propositions?: MissionPropositionView[] | null;
  propositionsLoading?: boolean;
  propositionsError?: string | null;
  onRefreshPropositions?: () => void;
  onSelectProposition?: (p: MissionProposition) => void;
}) {
  if (propositions && onRefreshPropositions && onSelectProposition) {
    return (
      <PropositionsPanel
        views={propositions}
        loading={propositionsLoading}
        error={propositionsError}
        onRefresh={onRefreshPropositions}
        onSelect={onSelectProposition}
      />
    );
  }
  if (warehouseId) {
    return <WarehouseDetailPanel id={warehouseId} carrierColor={carrierColor} />;
  }
  if (mission && missionCursor) {
    return (
      <MissionPanel
        mission={mission}
        progress={missionProgress}
        cursor={missionCursor}
        color={missionColor}
      />
    );
  }
  return null;
}
