import { useState } from "react";
import { addWarehouse, updateWarehouse } from "./api";
import { Modal } from "./Modal";
import { WarehouseForm, blankWarehouse } from "./WarehouseForm";
import type { Warehouse, WarehouseCreate } from "./types";

type ModalState = { mode: "add" } | { mode: "view" | "edit"; warehouse: Warehouse } | null;

function toCreate(w: Warehouse): WarehouseCreate {
  return {
    name: w.name,
    city: w.city,
    voivodeship: w.voivodeship,
    warehouse_type: w.warehouse_type,
    area_m2: w.area_m2,
    dock_doors: w.dock_doors,
    cold_storage: w.cold_storage,
    on_site_security: w.on_site_security,
    operating_hours: w.operating_hours,
    available_capacity_pct: w.available_capacity_pct,
    activation_time_hours: w.activation_time_hours,
  };
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="cp-row"><span className="k">{label}</span><span className="v">{value}</span></div>
  );
}

const yesNo = (b: boolean) => (b ? "Yes" : "No");

export function WarehousesSection({ carrierId, warehouses, companyName, defaultCity, defaultVoivodeship, onAdded, onUpdated }: {
  carrierId: string;
  warehouses: Warehouse[];
  companyName: string;
  defaultCity: string;
  defaultVoivodeship: string;
  onAdded: (w: Warehouse) => void;
  onUpdated: (w: Warehouse) => void;
}) {
  const [modal, setModal] = useState<ModalState>(null);

  return (
    <div className="cp-card">
      <div className="cp-section-head">
        <h2 className="cp-card-h2" style={{ margin: 0 }}>
          Warehouses <span style={{ color: "var(--cp-faint)", fontWeight: 500 }}>· {warehouses.length}</span>
        </h2>
        <button className="cp-btn cp-btn-primary cp-btn-sm" onClick={() => setModal({ mode: "add" })}>Add warehouse</button>
      </div>

      {warehouses.length === 0 && (
        <p className="cp-empty">No warehouses yet. Add a storage facility to offer capacity.</p>
      )}

      {warehouses.map((w) => (
        <div key={w.id} className="cp-item clickable" onClick={() => setModal({ mode: "view", warehouse: w })}>
          <div className="cp-item-head">
            <div>
              <div className="cp-item-title">{w.name}</div>
              <div className="cp-item-sub">
                {w.id} · {w.warehouse_type} · {w.city} · {w.area_m2}m² · {w.dock_doors} docks · {w.operating_hours}
              </div>
            </div>
          </div>
          <div className="cp-tags">
            <span className="cp-chip neutral">{w.available_capacity_pct}% free</span>
            {w.cold_storage && <span className="cp-chip neutral">Cold storage</span>}
            {w.on_site_security && <span className="cp-chip neutral">Security</span>}
          </div>
        </div>
      ))}

      {modal?.mode === "add" && (
        <Modal title="Add warehouse" onClose={() => setModal(null)}>
          <WarehouseForm
            initial={blankWarehouse(`${companyName} — ${defaultCity}`, defaultCity, defaultVoivodeship)}
            submitLabel="Add warehouse"
            onSubmit={async (w) => { onAdded(await addWarehouse(carrierId, w)); setModal(null); }}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {modal?.mode === "edit" && (
        <Modal title={`Edit ${modal.warehouse.id}`} onClose={() => setModal(null)}>
          <WarehouseForm
            initial={toCreate(modal.warehouse)}
            submitLabel="Save changes"
            onSubmit={async (w) => { onUpdated(await updateWarehouse(carrierId, modal.warehouse.id, w)); setModal(null); }}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      {modal?.mode === "view" && (
        <Modal title={modal.warehouse.name} onClose={() => setModal(null)}>
          <div className="cp-rows">
            <Row label="ID" value={modal.warehouse.id} />
            <Row label="Type" value={modal.warehouse.warehouse_type} />
            <Row label="City" value={`${modal.warehouse.city}, ${modal.warehouse.voivodeship}`} />
            <Row label="Area" value={`${modal.warehouse.area_m2} m²`} />
            <Row label="Dock doors" value={modal.warehouse.dock_doors} />
            <Row label="Operating hours" value={modal.warehouse.operating_hours} />
            <Row label="Available capacity" value={`${modal.warehouse.available_capacity_pct}%`} />
            <Row label="Activation time" value={`${modal.warehouse.activation_time_hours} h`} />
            <Row label="Cold storage" value={yesNo(modal.warehouse.cold_storage)} />
            <Row label="On-site security" value={yesNo(modal.warehouse.on_site_security)} />
          </div>
          <div className="cp-dialog-actions">
            <button className="cp-btn cp-btn-primary cp-btn-sm"
              onClick={() => setModal({ mode: "edit", warehouse: modal.warehouse })}>Edit</button>
            <button className="cp-btn cp-btn-ghost cp-btn-sm" onClick={() => setModal(null)}>Close</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
