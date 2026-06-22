import { useState } from "react";
import type { CarrierProfile, CompanyUpdate, Vehicle, Warehouse } from "./types";
import { STATUS_COLOR, RISK_COLOR, FIELD_LABEL, reasonLabel, reasonTone, fieldTone } from "./labels";
import { TopBar } from "./Shell";
import { Modal } from "./Modal";
import { CompanyForm } from "./CompanyForm";
import { VehiclesSection } from "./VehiclesSection";
import { WarehousesSection } from "./WarehousesSection";
import { MissionsSection } from "./MissionsSection";
import { updateCompany } from "./api";

function Row({ label, value, chip }: { label: string; value?: React.ReactNode; chip?: React.ReactNode }) {
  return (
    <div className="cp-row"><span className="k">{label}</span><span className="v">{chip ?? value}</span></div>
  );
}

function fieldDisplay(field: string, value: string | number): string {
  return field === "documentation_completeness_pct" ? `${value}%` : String(value);
}

function companyForm(p: CarrierProfile): CompanyUpdate {
  return {
    name: p.name, hq_city: p.hq_city, voivodeship: p.voivodeship,
    activity_type: p.activity_type, operating_region: p.operating_region,
    preferred_contact_channel: p.preferred_contact_channel,
    declared_activation_time_hours: p.declared_activation_time_hours,
    cost_per_km: p.cost_per_km,
  };
}

type Tab = "overview" | "fleet" | "warehouses" | "missions";

export function CarrierHome({ profile, onLogout }: { profile: CarrierProfile; onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [prof, setProf] = useState<CarrierProfile>(profile);
  const [vehicles, setVehicles] = useState<Vehicle[]>(profile.vehicles);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(profile.warehouses);
  const [showProfile, setShowProfile] = useState(false);
  const [editProfile, setEditProfile] = useState(false);

  const v = prof.verification;
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
      <TopBar right={
        <div className="cp-bar-actions">
          <button className="cp-iconbtn" title="Company profile" onClick={() => { setEditProfile(false); setShowProfile(true); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
            </svg>
          </button>
          <button className="cp-btn cp-btn-ghost" onClick={onLogout}>Log out</button>
        </div>
      } />

      <div className="cp-container cp-stack">
        <div>
          <h1 className="cp-h1">{prof.name}</h1>
          <p className="cp-sub">
            {prof.id} · {prof.tax_id} · {prof.hq_city}, {prof.voivodeship}
            {prof.source === "registered" &&
              <span className="cp-badge-soft" style={{ marginLeft: 10 }}>just registered</span>}
          </p>
        </div>

        <div className="cp-tabs">
          <button className={`cp-tab ${tab === "overview" ? "active" : ""}`} onClick={() => setTab("overview")}>Overview</button>
          <button className={`cp-tab ${tab === "fleet" ? "active" : ""}`} onClick={() => setTab("fleet")}>Fleet<span className="count">{vehicles.length}</span></button>
          <button className={`cp-tab ${tab === "warehouses" ? "active" : ""}`} onClick={() => setTab("warehouses")}>Warehouses<span className="count">{warehouses.length}</span></button>
          <button className={`cp-tab ${tab === "missions" ? "active" : ""}`} onClick={() => setTab("missions")}>Missions</button>
        </div>

        {tab === "overview" && (
          <>
            <div className="cp-card cp-card-pad-lg cp-verdict" style={{ ["--cp-accent-line" as string]: statusColor }}>
              <p className="cp-card-title">Verification status</p>
              <div className="cp-verdict-head">
                <span className="cp-pill" style={{ background: statusColor }}><span className="dot" />{v.status}</span>
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

            <div className="cp-card">
              <p className="cp-card-title">Data from public registries · auto-retrieved</p>
              <div className="cp-rows">
                {fieldOrder.map((key) => (
                  <Row key={key} label={FIELD_LABEL[key]}
                    chip={<span className={`cp-chip ${fieldTone(key, f[key])}`}>{fieldDisplay(key, f[key])}</span>} />
                ))}
              </div>
            </div>

            <div className="cp-card">
              <p className="cp-card-title">Company details · declared</p>
              <div className="cp-rows">
                <Row label="Activity type" value={prof.activity_type} />
                <Row label="Operating region" value={prof.operating_region} />
                <Row label="Preferred contact" value={prof.preferred_contact_channel} />
                <Row label="Declared activation time" value={`${prof.declared_activation_time_hours} h`} />
                <Row label="Cost per km" value={`${prof.cost_per_km} PLN`} />
                {prof.carrier_risk_rating && <Row label="Carrier risk rating" value={prof.carrier_risk_rating} />}
              </div>
            </div>
          </>
        )}

        {tab === "fleet" && (
          <VehiclesSection
            carrierId={prof.id} vehicles={vehicles}
            defaultCity={prof.hq_city} defaultActivation={prof.declared_activation_time_hours}
            onAdded={(x) => setVehicles(upsert(x))} onUpdated={(x) => setVehicles(upsert(x))}
          />
        )}

        {tab === "warehouses" && (
          <WarehousesSection
            carrierId={prof.id} warehouses={warehouses} companyName={prof.name}
            defaultCity={prof.hq_city} defaultVoivodeship={prof.voivodeship}
            onAdded={(x) => setWarehouses(upsert(x))} onUpdated={(x) => setWarehouses(upsert(x))}
          />
        )}

        {tab === "missions" && <MissionsSection carrierId={prof.id} />}
      </div>

      {showProfile && (
        <Modal title="Company profile" onClose={() => setShowProfile(false)}>
          {editProfile ? (
            <CompanyForm
              initial={companyForm(prof)}
              onSubmit={async (c) => {
                const updated = await updateCompany(prof.id, c);
                setProf(updated);
                setEditProfile(false);
              }}
              onCancel={() => setEditProfile(false)}
            />
          ) : (
            <>
              <div className="cp-rows">
                <Row label="Name" value={prof.name} />
                <Row label="Tax ID (NIP)" value={prof.tax_id} />
                <Row label="Headquarters" value={`${prof.hq_city}, ${prof.voivodeship}`} />
                <Row label="Activity type" value={prof.activity_type} />
                <Row label="Operating region" value={prof.operating_region} />
                <Row label="Preferred contact" value={prof.preferred_contact_channel} />
                <Row label="Declared activation time" value={`${prof.declared_activation_time_hours} h`} />
                <Row label="Cost per km" value={`${prof.cost_per_km} PLN`} />
              </div>
              <div className="cp-dialog-actions">
                <button className="cp-btn cp-btn-primary cp-btn-sm" onClick={() => setEditProfile(true)}>Edit</button>
                <button className="cp-btn cp-btn-ghost cp-btn-sm" onClick={() => setShowProfile(false)}>Close</button>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
