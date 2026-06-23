import { useState } from "react";
import type { WarehouseCreate } from "./types";

export const WAREHOUSE_TYPES = ["Emergency hub", "Ambient warehouse", "Cross-dock", "Cold storage", "Temporary staging"];
export const OPERATING_HOURS = ["24/7", "06:00-22:00", "08:00-18:00", "Emergency on-call"];
const VOIVODESHIPS = [
  "Dolnośląskie", "Kujawsko-Pomorskie", "Lubelskie", "Lubuskie", "Łódzkie",
  "Małopolskie", "Mazowieckie", "Opolskie", "Podkarpackie", "Podlaskie",
  "Pomorskie", "Śląskie", "Świętokrzyskie", "Warmińsko-Mazurskie",
  "Wielkopolskie", "Zachodniopomorskie",
];

export function blankWarehouse(name: string, city: string, voivodeship: string): WarehouseCreate {
  return {
    name, city, voivodeship,
    warehouse_type: "Cross-dock",
    area_m2: 2000,
    dock_doors: 4,
    cold_storage: false,
    on_site_security: true,
    operating_hours: "24/7",
    available_capacity_pct: 100,
    activation_time_hours: 5,
  };
}

export function WarehouseForm({ initial, submitLabel, onSubmit, onCancel }: {
  initial: WarehouseCreate;
  submitLabel: string;
  onSubmit: (w: WarehouseCreate) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<WarehouseCreate>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof WarehouseCreate>(k: K, v: WarehouseCreate[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const onType = (t: string) =>
    setForm((f) => ({ ...f, warehouse_type: t, cold_storage: t === "Cold storage" ? true : f.cold_storage }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try { await onSubmit(form); } catch (err) { setError(String(err)); setBusy(false); }
  };

  return (
    <form className="cp-form" onSubmit={submit}>
      <div className="cp-grid">
        <div className="cp-field">
          <label>Warehouse name</label>
          <input className="cp-input" required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="cp-field">
          <label>Warehouse type</label>
          <select className="cp-input" value={form.warehouse_type} onChange={(e) => onType(e.target.value)}>
            {WAREHOUSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="cp-field">
          <label>City</label>
          <input className="cp-input" required value={form.city} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div className="cp-field">
          <label>Voivodeship</label>
          <select className="cp-input" value={form.voivodeship} onChange={(e) => set("voivodeship", e.target.value)}>
            {VOIVODESHIPS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="cp-field">
          <label>Area (m²)</label>
          <input className="cp-input" type="number" min={0} value={form.area_m2}
            onChange={(e) => set("area_m2", Number(e.target.value))} />
        </div>
        <div className="cp-field">
          <label>Dock doors</label>
          <input className="cp-input" type="number" min={0} value={form.dock_doors}
            onChange={(e) => set("dock_doors", Number(e.target.value))} />
        </div>
        <div className="cp-field">
          <label>Operating hours</label>
          <select className="cp-input" value={form.operating_hours} onChange={(e) => set("operating_hours", e.target.value)}>
            {OPERATING_HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <div className="cp-field">
          <label>Available capacity (%)</label>
          <input className="cp-input" type="number" min={0} max={100} value={form.available_capacity_pct}
            onChange={(e) => set("available_capacity_pct", Number(e.target.value))} />
        </div>
        <div className="cp-field">
          <label>Activation time (h)</label>
          <input className="cp-input" type="number" min={0} max={72} value={form.activation_time_hours}
            onChange={(e) => set("activation_time_hours", Number(e.target.value))} />
        </div>
      </div>
      <div className="cp-inline-row" style={{ gap: 18 }}>
        <label style={{ display: "flex", gap: 7, alignItems: "center", fontSize: 13 }}>
          <input type="checkbox" checked={form.cold_storage}
            onChange={(e) => set("cold_storage", e.target.checked)} /> Cold storage
        </label>
        <label style={{ display: "flex", gap: 7, alignItems: "center", fontSize: 13 }}>
          <input type="checkbox" checked={form.on_site_security}
            onChange={(e) => set("on_site_security", e.target.checked)} /> On-site security
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
