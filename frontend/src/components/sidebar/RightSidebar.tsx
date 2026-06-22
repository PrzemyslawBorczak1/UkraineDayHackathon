import { Badge, CtaPill, SectionLabel, cx } from "../ui";

// Static placeholder mission — swap for the selected mission later.
const MISSION = {
  id: "MS-0001",
  status: "QUEUED",
  title: "Generators & tools",
  meta: "20.8t · equipment · priority P3",
  deadline: "T- 2d 3h",
  origin: "Kraków Hub 1",
  destination: "Lviv Hub 1",
  carrier: { name: "Baltic Translog", city: "Warszawa" },
  vehicles: [
    { id: "KV 1128B", kind: "Cargo Van", state: "maintenance" as const },
    { id: "KV 5655C", kind: "Tanker", state: "transit" as const },
  ],
};

/** Origin/destination row with a colored leading dot. */
function RoutePoint({
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
}

/** One assigned-vehicle card. */
function VehicleRow({
  id,
  kind,
  state,
}: {
  id: string;
  kind: string;
  state: "maintenance" | "transit";
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl ring-1 ring-black/5 px-4 py-3">
      <div className="size-9 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 3h13v10H1zM14 7h4l3 3v3h-7z" />
          <circle cx="6" cy="17" r="2" />
          <circle cx="18" cy="17" r="2" />
        </svg>
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold tabular-nums">{id}</div>
        <div className="text-[11px] text-neutral-500">{kind}</div>
      </div>
      <Badge tone={state === "maintenance" ? "rose" : "emerald"}>{state}</Badge>
    </div>
  );
}

/** Right rail: detail view for the selected mission. */
export function RightSidebar() {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-6 pt-6">
        <div className="flex items-center justify-between">
          <SectionLabel>Mission · {MISSION.id}</SectionLabel>
          <Badge>{MISSION.status}</Badge>
        </div>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">{MISSION.title}</h2>
        <p className="mt-1 text-[11px] text-neutral-500 tabular-nums">{MISSION.meta}</p>
      </div>

      {/* Deadline */}
      <div className="mx-6 mt-5 rounded-xl bg-neutral-50 ring-1 ring-black/5 px-4 py-3">
        <SectionLabel>Deadline</SectionLabel>
        <div className="mt-1 text-2xl font-semibold tabular-nums">{MISSION.deadline}</div>
      </div>

      {/* Route */}
      <div className="px-6 mt-6 space-y-4">
        <SectionLabel>Route</SectionLabel>
        <RoutePoint label="Origin" value={MISSION.origin} tone="origin" />
        <RoutePoint label="Destination" value={MISSION.destination} tone="destination" />
      </div>

      {/* Carrier */}
      <div className="px-6 mt-6">
        <SectionLabel>Carrier</SectionLabel>
        <div className="mt-2 rounded-xl ring-1 ring-black/5 px-4 py-3">
          <div className="text-sm font-medium">{MISSION.carrier.name}</div>
          <div className="text-[11px] text-neutral-500">{MISSION.carrier.city}</div>
        </div>
      </div>

      {/* Assigned vehicles */}
      <div className="px-6 mt-6 space-y-2">
        <SectionLabel>Assigned vehicles</SectionLabel>
        <div className="space-y-2">
          {MISSION.vehicles.map((v) => (
            <VehicleRow key={v.id} {...v} />
          ))}
        </div>
      </div>

      <div className="px-6 py-6 mt-auto">
        <CtaPill className="w-full">Summary →</CtaPill>
      </div>
    </div>
  );
}
