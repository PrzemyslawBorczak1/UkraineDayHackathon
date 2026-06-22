import { memo, type ReactNode } from "react";
import { Badge, SectionLabel, TruckGlyph, cx } from "../ui";
import type { BadgeTone } from "../ui";
import type { MissionDetail, VehicleAssignment, VehicleState } from "../../types";
import { useWarehouseDetail } from "../../hooks/useWarehouseDetail";

/** Maps a vehicle state to a badge tone. */
const STATE_TONE: Record<VehicleState, BadgeTone> = {
  queued: "neutral",
  transit: "emerald",
  delivered: "sky",
  maintenance: "rose",
};

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

/** One assigned-vehicle card. */
const VehicleRow = memo(function VehicleRow({ id, kind, state }: VehicleAssignment) {
  return (
    <div className="flex items-center gap-3 rounded-xl ring-1 ring-black/5 px-4 py-3">
      <div className="size-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400">
        <TruckGlyph />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold tabular-nums">{id}</div>
        <div className="text-[11px] text-neutral-500">{kind}</div>
      </div>
      <Badge tone={STATE_TONE[state]}>{state}</Badge>
    </div>
  );
});

/** A label/value stat row inside the warehouse detail view. */
const Stat = memo(function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-neutral-50 ring-1 ring-black/5 px-4 py-3">
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-1 text-sm font-semibold tabular-nums">{value}</div>
    </div>
  );
});

/** Availability status → badge tone. */
function availabilityTone(status: string): BadgeTone {
  const s = status.toLowerCase();
  if (s.includes("available") || s.includes("active")) return "emerald";
  if (s.includes("limited") || s.includes("partial")) return "amber";
  if (s.includes("full") || s.includes("unavailable") || s.includes("closed")) return "rose";
  return "neutral";
}

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
          <Badge tone={availabilityTone(w.availability_status)}>{w.availability_status}</Badge>
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
 * Right rail: warehouse detail when one is selected. Falls back to a mission
 * detail only if a `mission` is explicitly passed; otherwise renders nothing.
 */
export function RightSidebar({
  mission,
  warehouseId,
  carrierColor,
}: {
  mission?: MissionDetail;
  warehouseId?: string | null;
  carrierColor?: string;
}) {
  if (warehouseId) {
    return <WarehouseDetailPanel id={warehouseId} carrierColor={carrierColor} />;
  }
  if (mission) {
    return <MissionDetailPanel mission={mission} />;
  }
  return null;
}

/** Right rail: detail view for the selected mission. */
function MissionDetailPanel({ mission }: { mission: MissionDetail }) {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-6 pt-6">
        <div className="flex items-center justify-between">
          <SectionLabel>Mission · {mission.id}</SectionLabel>
          <Badge>{mission.status}</Badge>
        </div>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">{mission.title}</h2>
        <p className="mt-1 text-[11px] text-neutral-500 tabular-nums">{mission.meta}</p>
      </div>

      {/* Deadline */}
      <div className="mx-6 mt-5 rounded-xl bg-neutral-50 ring-1 ring-black/5 px-4 py-3">
        <SectionLabel>Deadline</SectionLabel>
        <div className="mt-1 text-2xl font-semibold tabular-nums">{mission.deadline}</div>
      </div>

      {/* Route */}
      <div className="px-6 mt-6 space-y-4">
        <SectionLabel>Route</SectionLabel>
        <RoutePoint label="Origin" value={mission.origin} tone="origin" />
        <RoutePoint label="Destination" value={mission.destination} tone="destination" />
      </div>

      {/* Carrier */}
      <div className="px-6 mt-6">
        <SectionLabel>Carrier</SectionLabel>
        <div className="mt-2 rounded-xl ring-1 ring-black/5 px-4 py-3">
          <div className="text-sm font-medium">{mission.carrier.name}</div>
          <div className="text-[11px] text-neutral-500">{mission.carrier.city}</div>
        </div>
      </div>

      {/* Assigned vehicles */}
      <div className="px-6 mt-6 space-y-2">
        <SectionLabel>Assigned vehicles</SectionLabel>
        <div className="space-y-2">
          {mission.vehicles.map((v) => (
            <VehicleRow key={v.id} {...v} />
          ))}
        </div>
      </div>
    </div>
  );
}
