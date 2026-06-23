import { useState } from "react";
import { register } from "./api";
import type { CarrierProfile, RegisterPayload } from "./types";

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

// Sensible defaults so the form can be submitted in one click during a demo.
const DEFAULTS: RegisterPayload = {
  name: "Nowak Transport Sp. z o.o.",
  tax_id: "PL5267312345",
  hq_city: "Wrocław",
  voivodeship: "Dolnośląskie",
  activity_type: "General logistics",
  operating_region: "South-western Poland",
  preferred_contact_channel: "Email",
  declared_activation_time_hours: 4,
  cost_per_km: 4.5,
};

export function RegisterForm({ onRegistered }: { onRegistered: (p: CarrierProfile) => void }) {
  const [form, setForm] = useState<RegisterPayload>(DEFAULTS);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof RegisterPayload>(key: K, value: RegisterPayload[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      onRegistered(await register(form));
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="cp-form" onSubmit={submit}>
      <p className="cp-sub" style={{ marginTop: 0 }}>
        Register your company. Public-registry data (licence, insurance, sanctions
        screening) is retrieved automatically — you don't enter it. Vehicles and
        warehouses are added later, once you're logged in.
      </p>

      <div className="cp-grid">
        <div className="cp-field">
          <label>Company name</label>
          <input className="cp-input" required value={form.name}
            onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="cp-field">
          <label>Tax ID (NIP)</label>
          <input className="cp-input" required value={form.tax_id}
            onChange={(e) => set("tax_id", e.target.value)} />
        </div>
        <div className="cp-field">
          <label>Headquarters city</label>
          <input className="cp-input" required value={form.hq_city}
            onChange={(e) => set("hq_city", e.target.value)} />
        </div>
        <div className="cp-field">
          <label>Voivodeship</label>
          <select className="cp-input" value={form.voivodeship}
            onChange={(e) => set("voivodeship", e.target.value)}>
            {VOIVODESHIPS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="cp-field">
          <label>Activity type</label>
          <select className="cp-input" value={form.activity_type}
            onChange={(e) => set("activity_type", e.target.value)}>
            {ACTIVITY_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
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
            {CONTACT_CHANNELS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="cp-field">
          <label>Declared activation time (hours)</label>
          <input className="cp-input" type="number" min={0} max={72} required
            value={form.declared_activation_time_hours}
            onChange={(e) => set("declared_activation_time_hours", Number(e.target.value))} />
        </div>
        <div className="cp-field">
          <label>Cost per km (PLN)</label>
          <input className="cp-input" type="number" min={0} step={0.1} required
            value={form.cost_per_km}
            onChange={(e) => set("cost_per_km", Number(e.target.value))} />
        </div>
      </div>

      {error && <div className="cp-alert">{error}</div>}

      <button type="submit" className="cp-btn cp-btn-primary" disabled={submitting}
        style={{ alignSelf: "flex-start" }}>
        {submitting ? "Verifying…" : "Register & verify"}
      </button>
    </form>
  );
}
