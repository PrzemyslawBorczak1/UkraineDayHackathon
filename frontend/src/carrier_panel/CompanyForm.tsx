import { useState } from "react";
import type { CompanyUpdate } from "./types";

const VOIVODESHIPS = [
  "Dolnośląskie", "Kujawsko-Pomorskie", "Lubelskie", "Lubuskie", "Łódzkie",
  "Małopolskie", "Mazowieckie", "Opolskie", "Podkarpackie", "Podlaskie",
  "Pomorskie", "Śląskie", "Świętokrzyskie", "Warmińsko-Mazurskie",
  "Wielkopolskie", "Zachodniopomorskie",
];
const ACTIVITY_TYPES = [
  "Urban distribution", "Long-haul transport", "Refrigerated transport",
  "Warehousing", "General logistics",
];
const CONTACT_CHANNELS = ["Phone", "Email", "Web portal", "EDI"];

export function CompanyForm({ initial, onSubmit, onCancel }: {
  initial: CompanyUpdate;
  onSubmit: (c: CompanyUpdate) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<CompanyUpdate>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof CompanyUpdate>(k: K, v: CompanyUpdate[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try { await onSubmit(form); } catch (err) { setError(String(err)); setBusy(false); }
  };

  // Ensure the current value is selectable even if it isn't in the preset list.
  const withCurrent = (list: string[], v: string | undefined) => (!v || list.includes(v) ? list : [v, ...list]);

  return (
    <form className="cp-form" onSubmit={submit}>
      <div className="cp-grid">
        <div className="cp-field">
          <label>Company name</label>
          <input className="cp-input" required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="cp-field">
          <label>Headquarters city</label>
          <input className="cp-input" required value={form.hq_city} onChange={(e) => set("hq_city", e.target.value)} />
        </div>
        <div className="cp-field">
          <label>Voivodeship</label>
          <select className="cp-input" value={form.voivodeship} onChange={(e) => set("voivodeship", e.target.value)}>
            {withCurrent(VOIVODESHIPS, form.voivodeship).map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="cp-field">
          <label>Activity type</label>
          <select className="cp-input" value={form.activity_type} onChange={(e) => set("activity_type", e.target.value)}>
            {withCurrent(ACTIVITY_TYPES, form.activity_type).map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="cp-field">
          <label>Operating region</label>
          <input className="cp-input" required value={form.operating_region}
            onChange={(e) => set("operating_region", e.target.value)} />
        </div>
        <div className="cp-field">
          <label>Preferred contact channel</label>
          <select className="cp-input" value={form.preferred_contact_channel}
            onChange={(e) => set("preferred_contact_channel", e.target.value)}>
            {withCurrent(CONTACT_CHANNELS, form.preferred_contact_channel).map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="cp-field">
          <label>Declared activation time (h)</label>
          <input className="cp-input" type="number" min={0} max={72} value={form.declared_activation_time_hours}
            onChange={(e) => set("declared_activation_time_hours", Number(e.target.value))} />
        </div>
        <div className="cp-field">
          <label>Cost per km (PLN)</label>
          <input className="cp-input" type="number" min={0} step={0.1} value={form.cost_per_km}
            onChange={(e) => set("cost_per_km", Number(e.target.value))} />
        </div>
      </div>
      {error && <div className="cp-alert">{error}</div>}
      <div className="cp-dialog-actions">
        <button type="submit" className="cp-btn cp-btn-primary cp-btn-sm" disabled={busy}>
          {busy ? "Saving…" : "Save changes"}
        </button>
        <button type="button" className="cp-btn cp-btn-ghost cp-btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
