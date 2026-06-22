import { useState } from "react";
import { addVehicle, setVehicleAvailability } from "./api";
import { availabilityTone } from "./labels";
import type { Vehicle, VehicleCreate } from "./types";

const VEHICLE_TYPES = ["Van", "Rigid truck", "Standard semi", "Refrigerated semi", "BDF swap body"];
// Carrier can only toggle these two; "On mission" is set by the backend.
const AVAILABILITY = ["Available", "Unavailable"];

// Per-type defaults so adding a vehicle is mostly one click.
const PRESETS: Record<string, Partial<VehicleCreate>> = {
  "Van": { gross_vehicle_weight_t: 3.5, payload_t: 1.2, volume_m3: 10, operational_range_km: 300, temperature_controlled: false },
  "Rigid truck": { gross_vehicle_weight_t: 18, payload_t: 8, volume_m3: 45, operational_range_km: 500, temperature_controlled: false },
  "Standard semi": { gross_vehicle_weight_t: 40, payload_t: 24, volume_m3: 88, operational_range_km: 900, temperature_controlled: false },
  "Refrigerated semi": { gross_vehicle_weight_t: 40, payload_t: 22, volume_m3: 80, operational_range_km: 900, temperature_controlled: true },
  "BDF swap body": { gross_vehicle_weight_t: 40, payload_t: 22, volume_m3: 90, operational_range_km: 800, temperature_controlled: false },
};

function blank(defaultCity: string, activation: number): VehicleCreate {
  return {
    vehicle_type: "Standard semi",
    ...PRESETS["Standard semi"],
    current_city: defaultCity,
    activation_time_hours: activation,
    adr_enabled: false,
    liftgate: false,
    restriction_note: "",
  } as VehicleCreate;
}

export function VehiclesSection({ carrierId, vehicles, defaultCity, defaultActivation, onAdded, onUpdated }: {
  carrierId: string;
  vehicles: Vehicle[];
  defaultCity: string;
  defaultActivation: number;
  onAdded: (v: Vehicle) => void;
  onUpdated: (v: Vehicle) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<VehicleCreate>(() => blank(defaultCity, defaultActivation));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof VehicleCreate>(k: K, v: VehicleCreate[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onType = (t: string) => setForm((f) => ({ ...f, vehicle_type: t, ...PRESETS[t] }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      onAdded(await addVehicle(carrierId, form));
      setForm(blank(defaultCity, defaultActivation));
      setShowForm(false);
    } catch (err) { setError(String(err)); } finally { setBusy(false); }
  };

  const changeAvailability = async (v: Vehicle, status: string) => {
    try { onUpdated(await setVehicleAvailability(carrierId, v.id, status)); }
    catch (err) { setError(String(err)); }
  };

  return (
    <div className="cp-card">
      <div className="cp-section-head">
        <h2 className="cp-card-h2" style={{ margin: 0 }}>Fleet <span style={{ color: "var(--cp-faint)", fontWeight: 500 }}>· {vehicles.length}</span></h2>
        <button className="cp-btn cp-btn-primary cp-btn-sm" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "Add vehicle"}
        </button>
      </div>

      {showForm && (
        <form className="cp-form" onSubmit={submit}
          style={{ marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid var(--cp-line)" }}>
          <div className="cp-grid">
            <div className="cp-field">
              <label>Vehicle type</label>
              <select className="cp-input" value={form.vehicle_type} onChange={(e) => onType(e.target.value)}>
                {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="cp-field">
              <label>Current city</label>
              <input className="cp-input" required value={form.current_city}
                onChange={(e) => set("current_city", e.target.value)} />
            </div>
            <div className="cp-field">
              <label>Payload (t)</label>
              <input className="cp-input" type="number" step={0.1} min={0} value={form.payload_t}
                onChange={(e) => set("payload_t", Number(e.target.value))} />
            </div>
            <div className="cp-field">
              <label>Volume (m³)</label>
              <input className="cp-input" type="number" min={0} value={form.volume_m3}
                onChange={(e) => set("volume_m3", Number(e.target.value))} />
            </div>
            <div className="cp-field">
              <label>Gross weight (t)</label>
              <input className="cp-input" type="number" step={0.1} min={0} value={form.gross_vehicle_weight_t}
                onChange={(e) => set("gross_vehicle_weight_t", Number(e.target.value))} />
            </div>
            <div className="cp-field">
              <label>Operational range (km)</label>
              <input className="cp-input" type="number" min={0} value={form.operational_range_km}
                onChange={(e) => set("operational_range_km", Number(e.target.value))} />
            </div>
            <div className="cp-field">
              <label>Activation time (h)</label>
              <input className="cp-input" type="number" min={0} max={72} value={form.activation_time_hours}
                onChange={(e) => set("activation_time_hours", Number(e.target.value))} />
            </div>
            <div className="cp-field">
              <label>Restriction note (optional)</label>
              <input className="cp-input" value={form.restriction_note ?? ""}
                onChange={(e) => set("restriction_note", e.target.value)} />
            </div>
          </div>
          <div className="cp-inline-row" style={{ gap: 18 }}>
            <label style={{ display: "flex", gap: 7, alignItems: "center", fontSize: 13 }}>
              <input type="checkbox" checked={form.temperature_controlled}
                onChange={(e) => set("temperature_controlled", e.target.checked)} /> Temperature controlled
            </label>
            <label style={{ display: "flex", gap: 7, alignItems: "center", fontSize: 13 }}>
              <input type="checkbox" checked={form.adr_enabled}
                onChange={(e) => set("adr_enabled", e.target.checked)} /> ADR enabled
            </label>
            <label style={{ display: "flex", gap: 7, alignItems: "center", fontSize: 13 }}>
              <input type="checkbox" checked={form.liftgate}
                onChange={(e) => set("liftgate", e.target.checked)} /> Liftgate
            </label>
          </div>
          {error && <div className="cp-alert">{error}</div>}
          <button type="submit" className="cp-btn cp-btn-primary cp-btn-sm" disabled={busy}
            style={{ alignSelf: "flex-start" }}>
            {busy ? "Adding…" : "Add to fleet"}
          </button>
        </form>
      )}

      {vehicles.length === 0 && !showForm && (
        <p className="cp-empty">No vehicles yet. Add your first vehicle to build your fleet.</p>
      )}

      {vehicles.map((v) => (
        <div key={v.id} className="cp-item">
          <div className="cp-item-head">
            <div>
              <div className="cp-item-title">{v.vehicle_type}</div>
              <div className="cp-item-sub">
                {v.id} · {v.current_city} · {v.payload_t}t / {v.volume_m3}m³ · {v.operational_range_km}km range
              </div>
            </div>
            {v.availability_status === "On mission" ? (
              <span className="cp-chip neutral">On mission</span>
            ) : (
              <select className="cp-input cp-mini" value={v.availability_status}
                onChange={(e) => changeAvailability(v, e.target.value)}>
                {AVAILABILITY.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </div>
          <div className="cp-tags">
            <span className={`cp-chip ${availabilityTone(v.availability_status)}`}>{v.availability_status}</span>
            {v.temperature_controlled && <span className="cp-chip neutral">Refrigerated</span>}
            {v.adr_enabled && <span className="cp-chip neutral">ADR</span>}
            {v.liftgate && <span className="cp-chip neutral">Liftgate</span>}
            {v.restriction_note && <span className="cp-chip warn">{v.restriction_note}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
