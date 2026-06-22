import { useState } from "react";
import type { VehicleCreate } from "./types";

export const VEHICLE_TYPES = ["Van", "Rigid truck", "Standard semi", "Refrigerated semi", "BDF swap body"];

// Per-type defaults so adding a vehicle is mostly one click.
export const VEHICLE_PRESETS: Record<string, Partial<VehicleCreate>> = {
  "Van": { gvw_t: 3.5, payload_t: 1.2, volume_m3: 10, operational_range_km: 300, temperature_controlled: false },
  "Rigid truck": { gvw_t: 18, payload_t: 8, volume_m3: 45, operational_range_km: 500, temperature_controlled: false },
  "Standard semi": { gvw_t: 40, payload_t: 24, volume_m3: 88, operational_range_km: 900, temperature_controlled: false },
  "Refrigerated semi": { gvw_t: 40, payload_t: 22, volume_m3: 80, operational_range_km: 900, temperature_controlled: true },
  "BDF swap body": { gvw_t: 40, payload_t: 22, volume_m3: 90, operational_range_km: 800, temperature_controlled: false },
};

export function blankVehicle(defaultCity: string, activation: number): VehicleCreate {
  return {
    vehicle_type: "Standard semi",
    ...VEHICLE_PRESETS["Standard semi"],
    current_city: defaultCity,
    activation_time_hours: activation,
    adr_enabled: false,
    liftgate: false,
    restriction_note: "",
  } as VehicleCreate;
}

export function VehicleForm({ initial, submitLabel, onSubmit, onCancel }: {
  initial: VehicleCreate;
  submitLabel: string;
  onSubmit: (v: VehicleCreate) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<VehicleCreate>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof VehicleCreate>(k: K, v: VehicleCreate[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const onType = (t: string) => setForm((f) => ({ ...f, vehicle_type: t, ...VEHICLE_PRESETS[t] }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try { await onSubmit(form); } catch (err) { setError(String(err)); setBusy(false); }
  };

  return (
    <form className="cp-form" onSubmit={submit}>
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
          <input className="cp-input" type="number" step={0.1} min={0} value={form.gvw_t}
            onChange={(e) => set("gvw_t", Number(e.target.value))} />
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
      <div className="cp-dialog-actions">
        <button type="submit" className="cp-btn cp-btn-primary cp-btn-sm" disabled={busy}>
          {busy ? "Saving…" : submitLabel}
        </button>
        <button type="button" className="cp-btn cp-btn-ghost cp-btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
