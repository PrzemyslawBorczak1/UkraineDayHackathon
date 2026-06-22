"""In-RAM carrier store (no DB, no persistence — resets on restart).

Seeded at startup with the 50 carriers from the challenge CSVs — their real
verification data, fleet and warehouses. New companies are registered at
runtime (public data mocked, score computed, engine produces the verdict) and
start with an empty fleet; vehicles and warehouses are added afterwards.
"""
import csv
import os
from pathlib import Path
from typing import Optional

from app.verification import VerificationRecord, evaluate, compute_score
from app.carrier_panel.mock import generate_public_data
from app.carrier_panel.schemas import (
    CarrierProfile,
    CarrierSummary,
    RegisterRequest,
    Verification,
    VerificationFields,
    Vehicle,
    VehicleCreate,
    Warehouse,
    WarehouseCreate,
)

# carrier_id -> CarrierProfile
_COMPANIES: dict[str, CarrierProfile] = {}
_next_seq = 1   # next numeric suffix for generated carrier IDs (C0xx)
_next_v = 1     # next vehicle ID suffix (V0xxx)
_next_w = 1     # next warehouse ID suffix (W0xx)


def _parse_bool(value: str) -> bool:
    return (value or "").strip().lower() in ("yes", "true", "1")


# Collapse the dataset's 5 vehicle statuses to the 3 we use.
_VEHICLE_STATUS = {
    "available": "Available",
    "available within 6h": "Available",
    "on mission": "On mission",
    "maintenance": "Unavailable",
    "unavailable": "Unavailable",
}


def _veh_status(s: str) -> str:
    return _VEHICLE_STATUS.get((s or "").strip().lower(), "Available")


def _resolve_csv_dir() -> Path:
    env = os.getenv("CARRIER_CSV_DIR")
    candidates = [Path(env)] if env else []
    candidates += [
        Path("/data/csv"),  # docker mount
        Path("/home/bartek/onedayhackathon/instructins/DayOneUkraineHackathon/csv"),
        Path(__file__).resolve().parents[4] / "instructins/DayOneUkraineHackathon/csv",
    ]
    for c in candidates:
        if (c / "public_verification.csv").exists():
            return c
    raise FileNotFoundError(
        "CSV directory not found. Set CARRIER_CSV_DIR to the folder containing "
        "carriers.csv and public_verification.csv."
    )


def _build_verification(carrier_id: str, fields: VerificationFields, score: int) -> Verification:
    verdict = evaluate(VerificationRecord(
        carrier_id=carrier_id,
        company_registry_status=fields.company_registry_status,
        transport_licence_status=fields.transport_licence_status,
        insurance_status=fields.insurance_status,
        tax_arrears=fields.tax_arrears,
        sanctions_screening_result=fields.sanctions_screening_result,
        incidents_24m=fields.incidents_24m,
        public_verification_score=score,
    ))
    return Verification(
        status=verdict.status, risk=verdict.risk, score=verdict.score,
        triggered_rules=verdict.triggered_rules, fields=fields,
    )


def _load_vehicles(csv_dir: Path) -> tuple[dict[str, list[Vehicle]], int]:
    by_carrier: dict[str, list[Vehicle]] = {}
    max_seq = 0
    with open(csv_dir / "vehicles.csv", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            vid = r["Vehicle ID"]
            by_carrier.setdefault(r["Carrier ID"], []).append(Vehicle(
                id=vid,
                carrier_id=r["Carrier ID"],
                vehicle_type=r["Vehicle Type"],
                gross_vehicle_weight_t=float(r["Gross Vehicle Weight (t)"]),
                payload_t=float(r["Payload (t)"]),
                volume_m3=int(float(r["Volume (m3)"])),
                temperature_controlled=_parse_bool(r["Temperature Controlled"]),
                adr_enabled=_parse_bool(r["ADR Enabled"]),
                liftgate=_parse_bool(r["Liftgate"]),
                current_city=r["Current City"],
                availability_status=_veh_status(r["Availability Status"]),
                activation_time_hours=int(float(r["Activation Time (Hours)"])),
                operational_range_km=int(float(r["Operational Range (km)"])),
                restriction_note=(r.get("Restriction Note") or "").strip() or None,
            ))
            if vid.startswith("V") and vid[1:].isdigit():
                max_seq = max(max_seq, int(vid[1:]))
    return by_carrier, max_seq


def _load_warehouses(csv_dir: Path) -> tuple[dict[str, list[Warehouse]], int]:
    by_carrier: dict[str, list[Warehouse]] = {}
    max_seq = 0
    with open(csv_dir / "warehouses.csv", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            wid = r["Warehouse ID"]
            by_carrier.setdefault(r["Carrier ID"], []).append(Warehouse(
                id=wid,
                carrier_id=r["Carrier ID"],
                name=r["Warehouse Name"],
                city=r["City"],
                voivodeship=r["Voivodeship"],
                warehouse_type=r["Warehouse Type"],
                area_m2=int(float(r["Area (m2)"])),
                dock_doors=int(float(r["Dock Doors"])),
                cold_storage=_parse_bool(r["Cold Storage"]),
                on_site_security=_parse_bool(r["On-site Security"]),
                operating_hours=r["Operating Hours"],
                available_capacity_pct=int(float(r["Available Capacity (%)"])),
                availability_status=r["Availability Status"],
                activation_time_hours=int(float(r["Activation Time (Hours)"])),
            ))
            if wid.startswith("W") and wid[1:].isdigit():
                max_seq = max(max_seq, int(wid[1:]))
    return by_carrier, max_seq


def seed() -> None:
    """Load the 50 challenge carriers (+ their fleet & warehouses) into RAM."""
    global _next_seq, _next_v, _next_w
    if _COMPANIES:
        return

    csv_dir = _resolve_csv_dir()
    vehicles_by_carrier, max_v = _load_vehicles(csv_dir)
    warehouses_by_carrier, max_w = _load_warehouses(csv_dir)
    _next_v, _next_w = max_v + 1, max_w + 1

    carriers: dict[str, dict] = {}
    with open(csv_dir / "carriers.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            carriers[row["Carrier ID"]] = row

    max_seq = 0
    with open(csv_dir / "public_verification.csv", encoding="utf-8") as f:
        for pv in csv.DictReader(f):
            cid = pv["Carrier ID"]
            c = carriers.get(cid, {})
            fields = VerificationFields(
                company_registry_status=pv["Company Registry Status"],
                transport_licence_status=pv["Transport Licence Status"],
                insurance_status=pv["Insurance Status"],
                tax_arrears=pv["Fictional Tax Arrears"],
                sanctions_screening_result=pv["Sanctions Screening Result"],
                incidents_24m=int(pv["Incidents in Last 24 Months"]),
                documentation_completeness_pct=int(pv["Documentation Completeness (%)"]),
                reliability_score=int(c.get("Reliability Score (0-100)", 0) or 0),
            )
            score = int(pv["Public Verification Score (0-100)"])
            _COMPANIES[cid] = CarrierProfile(
                id=cid,
                name=c.get("Carrier Name", cid),
                tax_id=c.get("Fictional Tax ID", ""),
                hq_city=c.get("Headquarters City", ""),
                voivodeship=c.get("Voivodeship", ""),
                activity_type=c.get("Activity Type", ""),
                operating_region=c.get("Operating Region", ""),
                preferred_contact_channel=c.get("Preferred Contact Channel", ""),
                declared_activation_time_hours=int(c.get("Declared Activation Time (Hours)", 0) or 0),
                cost_per_km=float(c.get("Cost per km (PLN)", 0) or 0),
                carrier_risk_rating=c.get("Risk Rating"),
                source="seed",
                verification=_build_verification(cid, fields, score),
                vehicles=vehicles_by_carrier.get(cid, []),
                warehouses=warehouses_by_carrier.get(cid, []),
            )
            if cid.startswith("C") and cid[1:].isdigit():
                max_seq = max(max_seq, int(cid[1:]))

    _next_seq = max_seq + 1


def list_companies() -> list[CarrierSummary]:
    return [
        CarrierSummary(id=c.id, name=c.name, tax_id=c.tax_id,
                       status=c.verification.status, source=c.source)
        for c in _COMPANIES.values()
    ]


def get_company(carrier_id: str) -> Optional[CarrierProfile]:
    return _COMPANIES.get(carrier_id)


def register(req: RegisterRequest) -> CarrierProfile:
    """Register a new carrier: mock public data -> compute score -> run engine."""
    global _next_seq
    carrier_id = f"C{_next_seq:03d}"
    _next_seq += 1

    public = generate_public_data()
    fields = VerificationFields(**public)
    score = compute_score(
        reliability_score=fields.reliability_score,
        documentation_completeness_pct=fields.documentation_completeness_pct,
        company_registry_status=fields.company_registry_status,
        incidents_24m=fields.incidents_24m,
    )

    profile = CarrierProfile(
        id=carrier_id,
        name=req.name, tax_id=req.tax_id, hq_city=req.hq_city,
        voivodeship=req.voivodeship, activity_type=req.activity_type,
        operating_region=req.operating_region,
        preferred_contact_channel=req.preferred_contact_channel,
        declared_activation_time_hours=req.declared_activation_time_hours,
        cost_per_km=req.cost_per_km, carrier_risk_rating=None,
        source="registered",
        verification=_build_verification(carrier_id, fields, score),
    )
    _COMPANIES[carrier_id] = profile
    return profile


# --- Phase 2: fleet & warehouse mutations -----------------------------------

def add_vehicle(carrier_id: str, data: VehicleCreate) -> Optional[Vehicle]:
    global _next_v
    company = _COMPANIES.get(carrier_id)
    if company is None:
        return None
    vehicle = Vehicle(
        id=f"V{_next_v:04d}",
        carrier_id=carrier_id,
        availability_status="Available",
        **data.model_dump(),
    )
    _next_v += 1
    company.vehicles.append(vehicle)
    return vehicle


def add_warehouse(carrier_id: str, data: WarehouseCreate) -> Optional[Warehouse]:
    global _next_w
    company = _COMPANIES.get(carrier_id)
    if company is None:
        return None
    warehouse = Warehouse(
        id=f"W{_next_w:03d}",
        carrier_id=carrier_id,
        availability_status="Available",
        **data.model_dump(),
    )
    _next_w += 1
    company.warehouses.append(warehouse)
    return warehouse


def update_vehicle(carrier_id: str, vehicle_id: str, changes: dict) -> Optional[Vehicle]:
    company = _COMPANIES.get(carrier_id)
    if company is None:
        return None
    for v in company.vehicles:
        if v.id == vehicle_id:
            for key, value in changes.items():
                setattr(v, key, value)
            return v
    return None


def update_warehouse(carrier_id: str, warehouse_id: str, changes: dict) -> Optional[Warehouse]:
    company = _COMPANIES.get(carrier_id)
    if company is None:
        return None
    for w in company.warehouses:
        if w.id == warehouse_id:
            for key, value in changes.items():
                setattr(w, key, value)
            return w
    return None


def update_company(carrier_id: str, changes: dict) -> Optional[CarrierProfile]:
    company = _COMPANIES.get(carrier_id)
    if company is None:
        return None
    for key, value in changes.items():
        setattr(company, key, value)
    return company
