import { useEffect, useState } from "react";
import { getMissions } from "./api";
import { availabilityTone } from "./labels";
import { Modal } from "./Modal";
import type { Mission, Vehicle } from "./types";

const STATUS_COLOR: Record<string, string> = {
  Active:    "#22c55e",
  Upcoming:  "#f59e0b",
  Completed: "#9ca3af",
};

const PRIORITY_TONE: Record<string, string> = {
  Critical: "bad",
  High:     "warn",
  Normal:   "neutral",
};

const STATUS_ORDER = ["Active", "Upcoming", "Completed"];

function daysDiff(from: string, to: string): number {
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
}

function timeBadge(m: Mission): string | null {
  const today = new Date().toISOString().slice(0, 10);
  if (m.status === "Active") {
    const rem = daysDiff(today, m.end_date);
    return rem <= 0 ? "ends today" : `${rem}d remaining`;
  }
  if (m.status === "Upcoming") {
    const in_ = daysDiff(today, m.start_date);
    return in_ <= 0 ? "starts today" : `starts in ${in_}d`;
  }
  return null;
}

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
        <VRow label="Current city" value={vehicle.current_city} />
        <VRow label="Payload" value={`${vehicle.payload_t} t`} />
        <VRow label="Volume" value={`${vehicle.volume_m3} m³`} />
        <VRow label="Gross weight" value={`${vehicle.gross_vehicle_weight_t} t`} />
        <VRow label="Operational range" value={`${vehicle.operational_range_km} km`} />
        <VRow label="Activation time" value={`${vehicle.activation_time_hours} h`} />
        <VRow label="Temperature controlled" value={yesNo(vehicle.temperature_controlled)} />
        <VRow label="ADR enabled" value={yesNo(vehicle.adr_enabled)} />
        <VRow label="Liftgate" value={yesNo(vehicle.liftgate)} />
        {vehicle.restriction_note && <VRow label="Restriction note" value={vehicle.restriction_note} />}
      </div>
      <div className="cp-dialog-actions">
        <button className="cp-btn cp-btn-ghost cp-btn-sm" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}

function MissionCard({ m, vehicleMap, onVehicleClick }: {
  m: Mission;
  vehicleMap: Map<string, Vehicle>;
  onVehicleClick: (v: Vehicle) => void;
}) {
  const accentColor = STATUS_COLOR[m.status] ?? "#9ca3af";
  const badge = timeBadge(m);

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
            {badge && (
              <span style={{ fontSize: 11, color: accentColor, fontWeight: 600, marginLeft: 2 }}>{badge}</span>
            )}
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, color: "var(--cp-text, #0f172a)", marginBottom: 4 }}>{m.title}</div>
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
        <VRow label="Coordinator" value={m.coordinator} />

        {m.assigned_vehicle_ids.length > 0 && (
          <VRow label="Vehicles" value={
            <span style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {m.assigned_vehicle_ids.map((id) => {
                const v = vehicleMap.get(id);
                return v ? (
                  <button key={id} className="cp-chip neutral"
                    style={{ fontFamily: "monospace", cursor: "pointer", background: "var(--cp-line-soft, #f1f3f7)", border: "1px solid var(--cp-line, #e7e9ee)" }}
                    onClick={() => onVehicleClick(v)}>
                    {id}
                  </button>
                ) : (
                  <span key={id} className="cp-chip neutral" style={{ fontFamily: "monospace" }}>{id}</span>
                );
              })}
            </span>
          } />
        )}

        {m.assigned_warehouse_id && (
          <VRow label="Warehouse" value={
            <span className="cp-chip neutral" style={{ fontFamily: "monospace" }}>{m.assigned_warehouse_id}</span>
          } />
        )}
        {m.notes && <VRow label="Notes" value={m.notes} />}
      </div>

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

  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));

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
    <>
      <div className="cp-stack">
        {Object.entries(byStatus).map(([status, group]) => (
          <div key={status}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLOR[status], display: "inline-block" }} />
              <span style={{ fontWeight: 600, fontSize: 13, color: "var(--cp-ink, #0f172a)" }}>{status}</span>
              <span style={{ fontSize: 12, color: "var(--cp-faint)" }}>· {group.length}</span>
            </div>
            {group.map((m) => (
              <MissionCard key={m.id} m={m} vehicleMap={vehicleMap} onVehicleClick={setActiveVehicle} />
            ))}
          </div>
        ))}
      </div>

      {activeVehicle && <VehicleModal vehicle={activeVehicle} onClose={() => setActiveVehicle(null)} />}
    </>
  );
}
