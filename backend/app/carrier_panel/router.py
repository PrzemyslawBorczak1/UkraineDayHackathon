"""Carrier panel API routes."""
from fastapi import APIRouter, HTTPException

from app.carrier_panel import store
from app.carrier_panel.schemas import (
    AvailabilityUpdate,
    CarrierProfile,
    CarrierSummary,
    RegisterRequest,
    Vehicle,
    VehicleCreate,
    Warehouse,
    WarehouseCreate,
)

router = APIRouter(prefix="/api/carriers", tags=["carriers"])


@router.get("", response_model=list[CarrierSummary])
def list_carriers():
    """All carriers (seeded + newly registered) for the login picker."""
    return store.list_companies()


@router.post("/register", response_model=CarrierProfile)
def register_carrier(req: RegisterRequest):
    """Register a new company: mock public data, run the engine, store in RAM."""
    return store.register(req)


@router.get("/{carrier_id}", response_model=CarrierProfile)
def get_carrier(carrier_id: str):
    company = store.get_company(carrier_id)
    if company is None:
        raise HTTPException(status_code=404, detail=f"Carrier {carrier_id} not found")
    return company


# --- Fleet & warehouses (Phase 2) -------------------------------------------

@router.post("/{carrier_id}/vehicles", response_model=Vehicle)
def add_vehicle(carrier_id: str, data: VehicleCreate):
    vehicle = store.add_vehicle(carrier_id, data)
    if vehicle is None:
        raise HTTPException(status_code=404, detail=f"Carrier {carrier_id} not found")
    return vehicle


@router.post("/{carrier_id}/warehouses", response_model=Warehouse)
def add_warehouse(carrier_id: str, data: WarehouseCreate):
    warehouse = store.add_warehouse(carrier_id, data)
    if warehouse is None:
        raise HTTPException(status_code=404, detail=f"Carrier {carrier_id} not found")
    return warehouse


@router.patch("/{carrier_id}/vehicles/{vehicle_id}", response_model=Vehicle)
def update_vehicle_availability(carrier_id: str, vehicle_id: str, data: AvailabilityUpdate):
    vehicle = store.set_vehicle_availability(carrier_id, vehicle_id, data.availability_status)
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Carrier or vehicle not found")
    return vehicle
