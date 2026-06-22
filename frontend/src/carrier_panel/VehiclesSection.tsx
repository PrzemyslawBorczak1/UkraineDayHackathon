import { useState } from "react";
import { addVehicle, setVehicleAvailability, updateVehicle } from "./api";
import { availabilityTone } from "./labels";
import { Modal } from "./Modal";
import { VehicleForm, blankVehicle } from "./VehicleForm";
import type { Vehicle, VehicleCreate } from "./types";

// Carrier can only toggle these two; "On mission" is set by the backend.
const AVAILABILITY = ["Available", "Unavailable"];

type ModalState = { mode: "add" } | { mode: "view" | "edit"; vehicle: Vehicle } | null;

function toCreate(v: Vehicle): VehicleCreate {
  return {
    vehicle_type: v.vehicle_type,
    gross_vehicle_weight_t: v.gross_vehicle_weight_t,
    payload_t: v.payload_t,
    volume_m3: v.volume_m3,
    temperature_controlled: v.temperature_controlled,
    adr_enabled: v.adr_enabled,
    liftgate: v.liftgate,
    current_city: v.current_city,
    activation_time_hours: v.activation_time_hours,
    operational_range_km: v.operational_range_km,
    restriction_note: v.restriction_note ?? "",
  };
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="cp-row"><span className="k">{label}</span><span className="v">{value}</span></div>
  );
}

const yesNo = (b: boolean) => (b ? "Yes" : "No");

export function VehiclesSection({ carrierId, vehicles, defaultCity, defaultActivation, onAdded, onUpdated }: {
  carrierId: string;
  vehicles: Vehicle[];
  defaultCity: string;
  defaultActivation: number;
  onAdded: (v: Vehicle) => void;
  onUpdated: (v: Vehicle) => void;
}) {
  const [modal, setModal] = useState<ModalState>(null);

  const changeAvailability = async (v: Vehicle, status: string) => {
    onUpdated(await setVehicleAvailability(carrierId, v.id, status));
  };

  return (
    <div className="cp-card">
      <div className="cp-section-head">
        <h2 className="cp-card-h2" style={{ margin: 0 }}>
          Fleet <span style={{ color: "var(--cp-faint)", fontWeight: 500 }}>· {vehicles.length}</span>
        </h2>
        <button className="cp-btn cp-btn-primary cp-btn-sm" onClick={() => setModal({ mode: "add" })}>Add vehicle</button>
      </div>

      {vehicles.length === 0 && (
        <p className="cp-empty">No vehicles yet. Add your first vehicle to build your fleet.</p>
      )}

      {vehicles.map((v) => (
        <div key={v.id} className="cp-item clickable" onClick={() => setModal({ mode: "view", vehicle: v })}>
          <div className="cp-item-head">
            <div>
              <div className="cp-item-title">{v.vehicle_type}</div>
              <div className="cp-item-sub">
                {v.id} · {v.current_city} · {v.payload_t}t / {v.volume_m3}m³ · {v.operational_range_km}km range
              </div>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              {v.availability_status === "On mission" ? (
                <span className="cp-chip neutral">On mission</span>
              ) : (
                <select className="cp-input cp-mini" value={v.availability_status}
                  onChange={(e) => changeAvailability(v, e.target.value)}>
                  {AVAILABILITY.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              )}
            </div>
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

      {modal?.mode === "add" && (
        <Modal title="Add vehicle" onClose={() => setModal(null)}>
          <VehicleForm
            initial={blankVehicle(defaultCity, defaultActivation)}
            submitLabel="Add to fleet"
            onSubmit={async (v) => { onAdded(await addVehicle(carrierId, v)); setModal(null); }}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {modal?.mode === "edit" && (
        <Modal title={`Edit ${modal.vehicle.id}`} onClose={() => setModal(null)}>
          <VehicleForm
            initial={toCreate(modal.vehicle)}
            submitLabel="Save changes"
            onSubmit={async (v) => { onUpdated(await updateVehicle(carrierId, modal.vehicle.id, v)); setModal(null); }}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {modal?.mode === "view" && (
        <Modal title={`${modal.vehicle.vehicle_type} · ${modal.vehicle.id}`} onClose={() => setModal(null)}>
          <div className="cp-rows">
            <Row label="Availability" value={<span className={`cp-chip ${availabilityTone(modal.vehicle.availability_status)}`}>{modal.vehicle.availability_status}</span>} />
            <Row label="Current city" value={modal.vehicle.current_city} />
            <Row label="Payload" value={`${modal.vehicle.payload_t} t`} />
            <Row label="Volume" value={`${modal.vehicle.volume_m3} m³`} />
            <Row label="Gross weight" value={`${modal.vehicle.gross_vehicle_weight_t} t`} />
            <Row label="Operational range" value={`${modal.vehicle.operational_range_km} km`} />
            <Row label="Activation time" value={`${modal.vehicle.activation_time_hours} h`} />
            <Row label="Temperature controlled" value={yesNo(modal.vehicle.temperature_controlled)} />
            <Row label="ADR enabled" value={yesNo(modal.vehicle.adr_enabled)} />
            <Row label="Liftgate" value={yesNo(modal.vehicle.liftgate)} />
            {modal.vehicle.restriction_note && <Row label="Restriction note" value={modal.vehicle.restriction_note} />}
          </div>
          <div className="cp-dialog-actions">
            <button className="cp-btn cp-btn-primary cp-btn-sm"
              onClick={() => setModal({ mode: "edit", vehicle: modal.vehicle })}>Edit</button>
            <button className="cp-btn cp-btn-ghost cp-btn-sm" onClick={() => setModal(null)}>Close</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
