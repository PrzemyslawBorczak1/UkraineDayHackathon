import { useEffect, useState } from "react";
import { getMissions, updateMissionAcceptance } from "./api";
import { availabilityTone } from "./labels";
import { Modal } from "./Modal";
import { MissionRouteMap } from "./MissionRouteMap";
import type { Mission, TaskSummary, Vehicle } from "./types";

// Raw DB statuses → color
const STATUS_COLOR: Record<string, string> = {
  NEW:         "#94a3b8",
  ACCEPTED:    "#60a5fa",
  IN_PROGRESS: "#22c55e",
  DONE:        "#10b981",
};

// Grouping order for display
const STATUS_GROUPS: { label: string; statuses: string[] }[] = [
  { label: "In progress", statuses: ["IN_PROGRESS"] },
  { label: "Accepted",    statuses: ["ACCEPTED"] },
  { label: "New",         statuses: ["NEW"] },
  { label: "Completed",   statuses: ["DONE"] },
];

const PRIORITY_TONE: Record<string, string> = {
  Critical: "bad",
  High:     "warn",
  Normal:   "neutral",
};

const ACCEPTANCE_STYLE: Record<string, { bg: string; color: string }> = {
  Pending:  { bg: "#fef3c7", color: "#92400e" },
  Accepted: { bg: "#dcfce7", color: "#166534" },
  Rejected: { bg: "#fee2e2", color: "#991b1b" },
};

function VRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="cp-row"><span className="k">{label}</span><span className="v">{value}</span></div>
  );
}

function VehicleModal({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
  const yesNo = (b: boolean) => (b ? "Yes" : "No");
  return (
    <Modal title={`${vehicle.vehicle_type} · ${vehicle.id}`} onClose={onClose}>
      <div className="cp-rows">
        <VRow label="Availability" value={
          <span className={`cp-chip ${availabilityTone(vehicle.availability_status)}`}>
            {vehicle.availability_status}
          </span>
        } />
        <VRow label="Current city"       value={vehicle.current_city} />
        <VRow label="Payload"            value={`${vehicle.payload_t} t`} />
        <VRow label="Volume"             value={`${vehicle.volume_m3} m³`} />
        <VRow label="Gross weight"       value={`${vehicle.gvw_t} t`} />
        <VRow label="Operational range"  value={`${vehicle.operational_range_km} km`} />
        <VRow label="Activation time"    value={`${vehicle.activation_time_hours} h`} />
        <VRow label="Temperature controlled" value={yesNo(vehicle.temperature_controlled)} />
        <VRow label="ADR enabled"        value={yesNo(vehicle.adr_enabled)} />
        <VRow label="Liftgate"           value={yesNo(vehicle.liftgate)} />
        {vehicle.restriction_note && <VRow label="Restriction note" value={vehicle.restriction_note} />}
      </div>
      <div className="cp-dialog-actions">
        <button className="cp-btn cp-btn-ghost cp-btn-sm" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}

const TASK_STATUS_META: Record<string, { color: string; bg: string; dot: string }> = {
  Traveling:     { color: "#1d4ed8", bg: "#eff6ff", dot: "#3b82f6" },
  Transporting:  { color: "#065f46", bg: "#ecfdf5", dot: "#10b981" },
  PrepareUnload: { color: "#92400e", bg: "#fffbeb", dot: "#f59e0b" },
  Unload:        { color: "#7c2d12", bg: "#fff7ed", dot: "#f97316" },
  Wait:          { color: "#475569", bg: "#f8fafc", dot: "#94a3b8" },
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) +
    " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function duration(start: string | null, end: string | null): string {
  if (!start || !end) return "";
  const h = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 3_600_000);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d ${h % 24}h`;
}

function TasksTable({ tasks, vehicleMap, onVehicleClick }: {
  tasks: TaskSummary[];
  vehicleMap: Map<string, Vehicle>;
  onVehicleClick: (v: Vehicle) => void;
}) {
  if (tasks.length === 0) return null;
  return (
    <div style={{ marginTop: 12, borderTop: "1px solid var(--cp-line, #e7e9ee)", paddingTop: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--cp-faint)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
        Vehicle tasks · {tasks.length}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {tasks.map((t) => {
          const meta = TASK_STATUS_META[t.status] ?? TASK_STATUS_META["Wait"];
          const vehicle = vehicleMap.get(t.vehicle_id);
          const dur = duration(t.start_date, t.end_date);
          return (
            <div key={t.id} style={{
              display: "grid",
              gridTemplateColumns: "8px 1fr",
              gap: "0 10px",
              background: meta.bg,
              borderRadius: 6,
              overflow: "hidden",
              border: "1px solid var(--cp-line, #e7e9ee)",
            }}>
              <div style={{ background: meta.dot, borderRadius: "6px 0 0 6px" }} />
              <div style={{ padding: "8px 10px 8px 0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      style={{
                        fontFamily: "monospace", fontSize: 12, fontWeight: 700,
                        color: meta.color, background: "none", border: "none",
                        cursor: vehicle ? "pointer" : "default", padding: 0,
                        textDecoration: vehicle ? "underline dotted" : "none",
                      }}
                      onClick={() => vehicle && onVehicleClick(vehicle)}
                      title={vehicle ? "Click for vehicle details" : undefined}
                    >
                      {t.vehicle_id}
                    </button>
                    {vehicle && (
                      <span style={{ fontSize: 11, color: "var(--cp-faint)" }}>
                        {vehicle.vehicle_type}
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "1px 7px", borderRadius: 99,
                    background: meta.bg, color: meta.color,
                    border: `1px solid ${meta.dot}33`,
                  }}>
                    {t.status}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 12px", fontSize: 12 }}>
                  <div style={{ color: "var(--cp-faint)", display: "flex", gap: 4, alignItems: "center" }}>
                    <span style={{ opacity: 0.5 }}>↦</span>
                    <span>{fmtDate(t.start_date)}</span>
                  </div>
                  <div style={{ color: "var(--cp-faint)", display: "flex", gap: 4, alignItems: "center" }}>
                    <span style={{ opacity: 0.5 }}>↤</span>
                    <span>{fmtDate(t.end_date)}</span>
                  </div>
                  {(t.allocated_weight != null || t.allocated_volume != null) && (
                    <>
                      {t.allocated_weight != null && (
                        <div style={{ fontSize: 12, color: "var(--cp-ink, #0f172a)" }}>
                          <span style={{ color: "var(--cp-faint)" }}>Weight </span>
                          <strong>{t.allocated_weight.toFixed(1)} t</strong>
                        </div>
                      )}
                      {t.allocated_volume != null && (
                        <div style={{ fontSize: 12, color: "var(--cp-ink, #0f172a)" }}>
                          <span style={{ color: "var(--cp-faint)" }}>Volume </span>
                          <strong>{t.allocated_volume.toFixed(1)} m³</strong>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {dur && (
                  <div style={{ marginTop: 4, fontSize: 11, color: meta.color, fontWeight: 600 }}>
                    ⏱ {dur}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MissionCard({ m, vehicleMap, onVehicleClick, onAcceptanceChange }: {
  m: Mission;
  vehicleMap: Map<string, Vehicle>;
  onVehicleClick: (v: Vehicle) => void;
  onAcceptanceChange: (missionId: string, status: "Accepted" | "Rejected") => void;
}
) {
  const accentColor = STATUS_COLOR[m.status] ?? "#94a3b8";
  const acceptStyle = ACCEPTANCE_STYLE[m.acceptance_status] ?? ACCEPTANCE_STYLE["Pending"];

  return (
    <div className="cp-card cp-card-pad-lg" style={{
      borderLeft: `3px solid ${accentColor}`,
      marginBottom: 10,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6, alignItems: "center" }}>
            <span className="cp-chip" style={{ background: accentColor, color: "#fff", fontWeight: 600, border: "none" }}>
              {m.status}
            </span>
            <span className={`cp-chip ${PRIORITY_TONE[m.priority] ?? "neutral"}`}>{m.priority}</span>
            <span className="cp-chip neutral">{m.cargo_type}</span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
              background: acceptStyle.bg, color: acceptStyle.color,
            }}>
              {m.acceptance_status}
            </span>
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--cp-text, #0f172a)", marginBottom: 4 }}>
            {m.cargo_type} — {m.origin_point} → {m.destination_point}
          </div>
          <div style={{ fontSize: 13, color: "var(--cp-faint)", marginBottom: 8 }}>
            {m.origin_point} → {m.destination_point} · {m.route_distance_km} km
          </div>
        </div>
        <div style={{ fontSize: 12, color: "var(--cp-faint)", textAlign: "right", whiteSpace: "nowrap" }}>
          <div>{m.available_from.slice(0, 10)}</div>
          <div>{m.deadline.slice(0, 10)}</div>
        </div>
      </div>

      <div className="cp-rows" style={{ marginTop: 4 }}>
        <VRow label="Authority" value={m.requesting_authority} />
        <VRow label="Weight" value={`${m.weight_t} t`} />
        <VRow label="Volume" value={`${m.volume_m3} m³`} />
        <VRow label="Est. cost" value={`${m.estimated_cost.toLocaleString()} PLN`} />

        {m.assigned_vehicle_id && (
          <VRow label="Assigned vehicle" value={
            (() => {
              const v = vehicleMap.get(m.assigned_vehicle_id!);
              return v ? (
                <button className="cp-chip neutral"
                  style={{ fontFamily: "monospace", cursor: "pointer", background: "var(--cp-line-soft, #f1f3f7)", border: "1px solid var(--cp-line, #e7e9ee)" }}
                  onClick={() => onVehicleClick(v)}>
                  {m.assigned_vehicle_id}
                </button>
              ) : (
                <span className="cp-chip neutral" style={{ fontFamily: "monospace" }}>{m.assigned_vehicle_id}</span>
              );
            })()
          } />
        )}

        {m.special_requirement && <VRow label="Special req." value={m.special_requirement} />}
      </div>

      <TasksTable tasks={m.tasks} vehicleMap={vehicleMap} onVehicleClick={onVehicleClick} />
      <MissionRouteMap mission={m} />

      {m.acceptance_status === "Pending" && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            className="cp-btn cp-btn-sm"
            style={{ background: "#22c55e", color: "#fff", border: "none", fontWeight: 600 }}
            onClick={() => onAcceptanceChange(m.id, "Accepted")}
          >
            Accept mission
          </button>
          <button
            className="cp-btn cp-btn-ghost cp-btn-sm"
            style={{ color: "#dc2626", borderColor: "#dc2626" }}
            onClick={() => onAcceptanceChange(m.id, "Rejected")}
          >
            Reject
          </button>
        </div>
      )}

      <div style={{ fontSize: 11, color: "var(--cp-faint)", marginTop: 8 }}>{m.id}</div>
    </div>
  );
}

export function MissionsSection({ carrierId, vehicles }: { carrierId: string; vehicles: Vehicle[] }) {
  const [missions, setMissions] = useState<Mission[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeVehicle, setActiveVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    getMissions(carrierId)
      .then(setMissions)
      .catch((e) => setError(String(e)));
  }, [carrierId]);

  function handleAcceptanceChange(missionId: string, status: "Accepted" | "Rejected") {
    updateMissionAcceptance(carrierId, missionId, status)
      .then((updated) => {
        setMissions((prev) =>
          prev ? prev.map((m) => (m.id === updated.id ? updated : m)) : prev
        );
      })
      .catch((e) => setError(String(e)));
  }

  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));

  if (error) return <p className="cp-alert">{error}</p>;
  if (missions === null) return <p className="cp-empty">Loading missions…</p>;
  if (missions.length === 0) return (
    <div className="cp-card cp-card-pad-lg">
      <p className="cp-empty">No missions assigned yet. Missions are allocated by crisis coordinators.</p>
    </div>
  );

  // Group by status groups, keep ordering
  const grouped: { label: string; missions: Mission[] }[] = [];
  for (const group of STATUS_GROUPS) {
    const items = missions.filter((m) => group.statuses.includes(m.status));
    if (items.length) grouped.push({ label: group.label, missions: items });
  }
  // Any status not covered by groups
  const knownStatuses = new Set(STATUS_GROUPS.flatMap((g) => g.statuses));
  const other = missions.filter((m) => !knownStatuses.has(m.status));
  if (other.length) grouped.push({ label: "Other", missions: other });

  return (
    <>
      <div className="cp-stack">
        {grouped.map(({ label, missions: group }) => (
          <div key={label}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: "var(--cp-ink, #0f172a)" }}>{label}</span>
              <span style={{ fontSize: 12, color: "var(--cp-faint)" }}>· {group.length}</span>
            </div>
            {group.map((m) => (
              <MissionCard
                key={m.id}
                m={m}
                vehicleMap={vehicleMap}
                onVehicleClick={setActiveVehicle}
                onAcceptanceChange={handleAcceptanceChange}
              />
            ))}
          </div>
        ))}
      </div>

      {activeVehicle && <VehicleModal vehicle={activeVehicle} onClose={() => setActiveVehicle(null)} />}
    </>
  );
}
