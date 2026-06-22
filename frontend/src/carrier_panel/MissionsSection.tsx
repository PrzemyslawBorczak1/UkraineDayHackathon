import { useEffect, useState } from "react";
import { getMissions } from "./api";
import type { Mission } from "./types";

const STATUS_COLOR: Record<string, string> = {
  Active:    "#22c55e",
  Upcoming:  "#f59e0b",
  Completed: "#9ca3af",
};

const PRIORITY_TONE: Record<string, string> = {
  Critical: "danger",
  High:     "warn",
  Normal:   "neutral",
};

const STATUS_ORDER = ["Active", "Upcoming", "Completed"];

function MissionCard({ m }: { m: Mission }) {
  const accentColor = STATUS_COLOR[m.status] ?? "#9ca3af";
  return (
    <div className="cp-card cp-card-pad-lg" style={{ ["--cp-accent-line" as string]: accentColor, borderLeft: "3px solid var(--cp-accent-line)", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
            <span className="cp-chip" style={{ background: accentColor, color: "#fff", fontWeight: 600 }}>{m.status}</span>
            <span className={`cp-chip ${PRIORITY_TONE[m.priority] ?? "neutral"}`}>{m.priority}</span>
            <span className="cp-chip neutral">{m.cargo_type}</span>
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--cp-text)", marginBottom: 4 }}>{m.title}</div>
          <div style={{ fontSize: 13, color: "var(--cp-faint)", marginBottom: 8 }}>
            {m.origin_city} → {m.destination_city} · {m.distance_km} km
          </div>
        </div>
        <div style={{ fontSize: 12, color: "var(--cp-faint)", textAlign: "right", whiteSpace: "nowrap" }}>
          <div>{m.start_date}</div>
          <div>{m.end_date}</div>
        </div>
      </div>

      <div className="cp-rows" style={{ marginTop: 4 }}>
        <MRow label="Coordinator" value={m.coordinator} />
        {m.assigned_vehicle_ids.length > 0 && (
          <MRow label="Vehicles" value={
            <span style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {m.assigned_vehicle_ids.map((id) => (
                <span key={id} className="cp-chip neutral" style={{ fontFamily: "monospace" }}>{id}</span>
              ))}
            </span>
          } />
        )}
        {m.assigned_warehouse_id && (
          <MRow label="Warehouse" value={
            <span className="cp-chip neutral" style={{ fontFamily: "monospace" }}>{m.assigned_warehouse_id}</span>
          } />
        )}
        {m.notes && <MRow label="Notes" value={m.notes} />}
      </div>

      <div style={{ fontSize: 11, color: "var(--cp-faint)", marginTop: 8 }}>{m.id}</div>
    </div>
  );
}

function MRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="cp-row"><span className="k">{label}</span><span className="v">{value}</span></div>
  );
}

export function MissionsSection({ carrierId }: { carrierId: string }) {
  const [missions, setMissions] = useState<Mission[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMissions(carrierId)
      .then(setMissions)
      .catch((e) => setError(String(e)));
  }, [carrierId]);

  if (error) return <p className="cp-alert">{error}</p>;
  if (missions === null) return <p className="cp-empty">Loading missions…</p>;
  if (missions.length === 0) return (
    <div className="cp-card cp-card-pad-lg">
      <p className="cp-empty">No missions assigned yet. Missions are allocated by crisis coordinators.</p>
    </div>
  );

  const byStatus = STATUS_ORDER.reduce<Record<string, Mission[]>>((acc, s) => {
    const group = missions.filter((m) => m.status === s);
    if (group.length) acc[s] = group;
    return acc;
  }, {});

  return (
    <div className="cp-stack">
      {Object.entries(byStatus).map(([status, group]) => (
        <div key={status}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLOR[status], display: "inline-block" }} />
            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--cp-text)" }}>{status}</span>
            <span style={{ fontSize: 12, color: "var(--cp-faint)" }}>· {group.length}</span>
          </div>
          {group.map((m) => <MissionCard key={m.id} m={m} />)}
        </div>
      ))}
    </div>
  );
}
