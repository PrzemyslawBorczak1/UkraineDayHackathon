"""Carrier panel API routes — all data from the shared PostgreSQL DB."""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from shapely.geometry import Point
from geoalchemy2.shape import from_shape
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models import Carrier, Vehicle, Warehouse, Mission, Task
from app.models.public_verification import PublicVerification
from app.carrier_panel import missions as missions_store
from app.carrier_panel.mock import generate_public_data
from app.carrier_panel.schemas import (
    CarrierOut,
    CarrierSummaryOut,
    CompanyUpdate,
    MissionOut,
    RegisterRequest,
    TaskOut,
    VehicleCreate,
    VehicleOut,
    VehicleUpdate,
    WarehouseCreate,
    WarehouseOut,
    WarehouseUpdate,
)

# Statuses where acceptance defaults to Accepted (mission already running/done)
_RUNNING_STATUSES = {"IN_PROGRESS", "DONE"}

# Default geometry — center of Poland — used for newly registered carriers
_POLAND_CENTER = from_shape(Point(19.5, 52.0), srid=4326)


def _load_carrier(db: Session, carrier_id: str) -> Optional[Carrier]:
    return (
        db.query(Carrier)
        .options(
            selectinload(Carrier.vehicles),
            selectinload(Carrier.warehouses),
            selectinload(Carrier.verification),
        )
        .filter(Carrier.id == carrier_id)
        .first()
    )


def _mission_out(m: Mission, tasks: list[Task]) -> MissionOut:
    default_acceptance = "Accepted" if m.status in _RUNNING_STATUSES else "Pending"
    acceptance = missions_store.get_acceptance(m.id, default=default_acceptance)
    out = MissionOut.model_validate(m)
    out.acceptance_status = acceptance
    out.tasks = [TaskOut.model_validate(t) for t in tasks]
    return out


def _next_carrier_id(db: Session) -> str:
    last = db.query(Carrier.id).order_by(Carrier.id.desc()).first()
    if last is None:
        return "C001"
    try:
        num = int(last[0][1:])
        return f"C{num + 1:03d}"
    except (ValueError, IndexError):
        return "C999"


def _next_vehicle_id(db: Session) -> str:
    last = db.query(Vehicle.id).order_by(Vehicle.id.desc()).first()
    if last is None:
        return "V0001"
    try:
        num = int(last[0][1:])
        return f"V{num + 1:04d}"
    except (ValueError, IndexError):
        return "V9999"


def _next_warehouse_id(db: Session) -> str:
    last = db.query(Warehouse.id).order_by(Warehouse.id.desc()).first()
    if last is None:
        return "W001"
    try:
        num = int(last[0][1:])
        return f"W{num + 1:03d}"
    except (ValueError, IndexError):
        return "W999"


class AcceptanceUpdate(BaseModel):
    acceptance_status: str  # "Accepted" | "Rejected" | "Pending"


router = APIRouter(prefix="/api/carriers", tags=["carriers"])


@router.get("", response_model=list[CarrierSummaryOut])
def list_carriers(db: Session = Depends(get_db)):
    return db.query(Carrier).order_by(Carrier.id).all()


@router.post("/register", response_model=CarrierOut, status_code=201)
def register_carrier(req: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new company: generate mock public data, run verification, save to DB."""
    from app.verification import VerificationRecord, evaluate, compute_score

    carrier_id = _next_carrier_id(db)

    public = generate_public_data()
    score = compute_score(
        reliability_score=public.get("reliability_score", 50),
        documentation_completeness_pct=public.get("documentation_completeness_pct", 80),
        company_registry_status=public.get("company_registry_status", "Active"),
        incidents_24m=public.get("incidents_24m", 0),
    )
    verdict = evaluate(VerificationRecord(
        carrier_id=carrier_id,
        company_registry_status=public["company_registry_status"],
        transport_licence_status=public["transport_licence_status"],
        insurance_status=public["insurance_status"],
        tax_arrears=public["tax_arrears"],
        sanctions_screening_result=public["sanctions_screening_result"],
        incidents_24m=public["incidents_24m"],
        public_verification_score=score,
    ))

    carrier = Carrier(
        id=carrier_id,
        name=req.name,
        tax_id=req.tax_id,
        hq_city=req.hq_city,
        voivodeship=req.voivodeship,
        hq_geom=_POLAND_CENTER,
        activity_type=req.activity_type,
        declared_fleet_size=0,
        declared_warehouse_capacity_m2=0,
        crisis_participation_status="Pending",
        documentation_status="Pending",
        insurance_expiry_date=date(2027, 12, 31),
        transport_licence_expiry_date=date(2027, 12, 31),
        declared_activation_time_hours=req.declared_activation_time_hours,
        reliability_score=public.get("reliability_score", 50),
        risk_rating=verdict.risk,
        cost_per_km=req.cost_per_km,
        preferred_contact_channel=req.preferred_contact_channel,
        operating_region=req.operating_region,
    )
    db.add(carrier)

    verification = PublicVerification(
        carrier_id=carrier_id,
        company_registry_status=public["company_registry_status"],
        transport_licence_status=public["transport_licence_status"],
        insurance_status=public["insurance_status"],
        tax_arrears=public["tax_arrears"],
        sanctions_screening_result=public["sanctions_screening_result"],
        registry_match_quality="High",
        incidents_24m=public["incidents_24m"],
        documentation_completeness_pct=public.get("documentation_completeness_pct", 80),
        public_verification_score=score,
        verification_result=verdict.status,
        verification_notes=", ".join(verdict.triggered_rules) if verdict.triggered_rules else None,
    )
    db.add(verification)
    db.commit()

    return _load_carrier(db, carrier_id)


@router.get("/{carrier_id}", response_model=CarrierOut)
def get_carrier(carrier_id: str, db: Session = Depends(get_db)):
    carrier = _load_carrier(db, carrier_id)
    if carrier is None:
        raise HTTPException(status_code=404, detail=f"Carrier {carrier_id} not found")
    return carrier


@router.patch("/{carrier_id}", response_model=CarrierOut)
def update_carrier(carrier_id: str, data: CompanyUpdate, db: Session = Depends(get_db)):
    carrier = db.query(Carrier).filter(Carrier.id == carrier_id).first()
    if carrier is None:
        raise HTTPException(status_code=404, detail=f"Carrier {carrier_id} not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(carrier, key, value)
    db.commit()
    return _load_carrier(db, carrier_id)


# --- Fleet & warehouses ------------------------------------------------------

@router.post("/{carrier_id}/vehicles", response_model=VehicleOut, status_code=201)
def add_vehicle(carrier_id: str, data: VehicleCreate, db: Session = Depends(get_db)):
    if db.query(Carrier).filter(Carrier.id == carrier_id).first() is None:
        raise HTTPException(status_code=404, detail=f"Carrier {carrier_id} not found")
    vehicle = Vehicle(
        id=_next_vehicle_id(db),
        carrier_id=carrier_id,
        availability_status="Available",
        current_geom=_POLAND_CENTER,
        **data.model_dump(),
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.post("/{carrier_id}/warehouses", response_model=WarehouseOut, status_code=201)
def add_warehouse(carrier_id: str, data: WarehouseCreate, db: Session = Depends(get_db)):
    if db.query(Carrier).filter(Carrier.id == carrier_id).first() is None:
        raise HTTPException(status_code=404, detail=f"Carrier {carrier_id} not found")
    warehouse = Warehouse(
        id=_next_warehouse_id(db),
        carrier_id=carrier_id,
        availability_status="Available",
        geom=_POLAND_CENTER,
        **data.model_dump(),
    )
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    return warehouse


@router.patch("/{carrier_id}/vehicles/{vehicle_id}", response_model=VehicleOut)
def update_vehicle(carrier_id: str, vehicle_id: str, data: VehicleUpdate, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(
        Vehicle.id == vehicle_id, Vehicle.carrier_id == carrier_id
    ).first()
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Carrier or vehicle not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(vehicle, key, value)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.patch("/{carrier_id}/warehouses/{warehouse_id}", response_model=WarehouseOut)
def update_warehouse(carrier_id: str, warehouse_id: str, data: WarehouseUpdate, db: Session = Depends(get_db)):
    warehouse = db.query(Warehouse).filter(
        Warehouse.id == warehouse_id, Warehouse.carrier_id == carrier_id
    ).first()
    if warehouse is None:
        raise HTTPException(status_code=404, detail="Carrier or warehouse not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(warehouse, key, value)
    db.commit()
    db.refresh(warehouse)
    return warehouse


# --- Missions (from DB) ------------------------------------------------------

@router.get("/{carrier_id}/missions", response_model=list[MissionOut])
def get_missions(carrier_id: str, db: Session = Depends(get_db)):
    if db.query(Carrier).filter(Carrier.id == carrier_id).first() is None:
        raise HTTPException(status_code=404, detail=f"Carrier {carrier_id} not found")

    db_missions = (
        db.query(Mission)
        .filter(Mission.assigned_carrier_id == carrier_id)
        .order_by(Mission.available_from)
        .all()
    )

    result = []
    for m in db_missions:
        tasks = db.query(Task).filter(Task.mission_id == m.id).all()
        result.append(_mission_out(m, tasks))
    return result


@router.patch("/{carrier_id}/missions/{mission_id}/acceptance", response_model=MissionOut)
def update_mission_acceptance(
    carrier_id: str, mission_id: str, data: AcceptanceUpdate, db: Session = Depends(get_db)
):
    allowed = {"Accepted", "Rejected", "Pending"}
    if data.acceptance_status not in allowed:
        raise HTTPException(status_code=422, detail=f"acceptance_status must be one of {allowed}")

    m = db.query(Mission).filter(
        Mission.id == mission_id,
        Mission.assigned_carrier_id == carrier_id,
    ).first()
    if m is None:
        raise HTTPException(status_code=404, detail=f"Mission {mission_id} not found for carrier {carrier_id}")

    missions_store.set_acceptance(mission_id, data.acceptance_status)
    tasks = db.query(Task).filter(Task.mission_id == mission_id).all()
    return _mission_out(m, tasks)
