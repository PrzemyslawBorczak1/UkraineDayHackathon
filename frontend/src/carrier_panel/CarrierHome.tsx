import { useState } from "react";
import type { CarrierProfile, Vehicle, Warehouse } from "./types";
import {
  STATUS_COLOR, RISK_COLOR, FIELD_LABEL,
  reasonLabel, reasonTone, fieldTone,
} from "./labels";
import { TopBar } from "./Shell";
import { VehiclesSection } from "./VehiclesSection";
import { WarehousesSection } from "./WarehousesSection";

function Row({ label, value, chip }: { label: string; value?: React.ReactNode; chip?: React.ReactNode }) {
  return (
    <div className="cp-row">
      <span className="k">{label}</span>
      <span className="v">{chip ?? value}</span>
    </div>
  );
}

function fieldDisplay(field: string, value: string | number): string {
  if (field === "documentation_completeness_pct") return `${value}%`;
  return String(value);
}

type Tab = "overview" | "fleet" | "warehouses";

export function CarrierHome({ profile, onLogout }: {
  profile: CarrierProfile; onLogout: () => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [vehicles, setVehicles] = useState<Vehicle[]>(profile.vehicles);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(profile.warehouses);

  const v = profile.verification;
  const statusColor = STATUS_COLOR[v.status] ?? "#6b7280";
  const riskColor = RISK_COLOR[v.risk] ?? "#6b7280";
  const f = v.fields;

  const fieldOrder: (keyof typeof f)[] = [
    "company_registry_status", "transport_licence_status", "insurance_status",
    "tax_arrears", "sanctions_screening_result", "incidents_24m",
    "documentation_completeness_pct", "reliability_score",
  ];

  const upsert = <T extends { id: string }>(item: T) => (prev: T[]) =>
    prev.some((x) => x.id === item.id) ? prev.map((x) => (x.id === item.id ? item : x)) : [...prev, item];

  return (
    <div className="cp-app">
      <TopBar right={<button className="cp-btn cp-btn-ghost" onClick={onLogout}>Log out</button>} />

      <div className="cp-container cp-stack">
        {/* Identity */}
        <div>
          <h1 className="cp-h1">{profile.name}</h1>
          <p className="cp-sub">
            {profile.id} · {profile.tax_id} · {profile.hq_city}, {profile.voivodeship}
            {profile.source === "registered" &&
              <span className="cp-badge-soft" style={{ marginLeft: 10 }}>just registered</span>}
          </p>
        </div>

        {/* Tabs */}
        <div className="cp-tabs">
          <button className={`cp-tab ${tab === "overview" ? "active" : ""}`} onClick={() => setTab("overview")}>Overview</button>
          <button className={`cp-tab ${tab === "fleet" ? "active" : ""}`} onClick={() => setTab("fleet")}>
            Fleet<span className="count">{vehicles.length}</span>
          </button>
          <button className={`cp-tab ${tab === "warehouses" ? "active" : ""}`} onClick={() => setTab("warehouses")}>
            Warehouses<span className="count">{warehouses.length}</span>
          </button>
        </div>

        {tab === "overview" && (
          <>
            {/* Verdict hero */}
            <div className="cp-card cp-card-pad-lg cp-verdict"
              style={{ ["--cp-accent-line" as string]: statusColor }}>
              <p className="cp-card-title">Verification status</p>
              <div className="cp-verdict-head">
                <span className="cp-pill" style={{ background: statusColor }}>
                  <span className="dot" />{v.status}
                </span>
                <span className="cp-meta-chip">Risk <strong style={{ color: riskColor }}>{v.risk}</strong></span>
              </div>

              <div className="cp-score-wrap">
                <div className="cp-score-top">
                  <span className="cp-score-label">Verification score</span>
                  <span className="cp-score-num">{v.score}<span style={{ color: "var(--cp-faint)", fontWeight: 500 }}>/100</span></span>
                </div>
                <div className="cp-score-track">
                  <div className="cp-score-fill" style={{ width: `${v.score}%`, background: statusColor }} />
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <p className="cp-card-title" style={{ marginBottom: 8 }}>Why</p>
                <ul className="cp-reasons">
                  {v.triggered_rules.map((r) => (
                    <li key={r} className={`cp-reason ${reasonTone(r)}`}><span className="bar" />{reasonLabel(r)}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Public registry data */}
            <div className="cp-card">
              <p className="cp-card-title">Data from public registries · auto-retrieved</p>
              <div className="cp-rows">
                {fieldOrder.map((key) => (
                  <Row key={key} label={FIELD_LABEL[key]}
                    chip={<span className={`cp-chip ${fieldTone(key, f[key])}`}>{fieldDisplay(key, f[key])}</span>} />
                ))}
              </div>
            </div>

            {/* Declared details */}
            <div className="cp-card">
              <p className="cp-card-title">Company details · declared</p>
              <div className="cp-rows">
                <Row label="Activity type" value={profile.activity_type} />
                <Row label="Operating region" value={profile.operating_region} />
                <Row label="Preferred contact" value={profile.preferred_contact_channel} />
                <Row label="Declared activation time" value={`${profile.declared_activation_time_hours} h`} />
                <Row label="Cost per km" value={`${profile.cost_per_km} PLN`} />
                {profile.carrier_risk_rating && <Row label="Carrier risk rating" value={profile.carrier_risk_rating} />}
              </div>
            </div>
          </>
        )}

        {tab === "fleet" && (
          <VehiclesSection
            carrierId={profile.id}
            vehicles={vehicles}
            defaultCity={profile.hq_city}
            defaultActivation={profile.declared_activation_time_hours}
            onAdded={(veh) => setVehicles(upsert(veh))}
            onUpdated={(veh) => setVehicles(upsert(veh))}
          />
        )}

        {tab === "warehouses" && (
          <WarehousesSection
            carrierId={profile.id}
            warehouses={warehouses}
            companyName={profile.name}
            defaultCity={profile.hq_city}
            defaultVoivodeship={profile.voivodeship}
            onAdded={(wh) => setWarehouses(upsert(wh))}
          />
        )}
      </div>
    </div>
  );
}
