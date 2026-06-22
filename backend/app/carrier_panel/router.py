"""Carrier panel API routes."""
from fastapi import APIRouter, HTTPException

from app.carrier_panel import store
from app.carrier_panel import missions as missions_store
from app.carrier_panel.schemas import (
    CarrierProfile,
    CarrierSummary,
    CompanyUpdate,
    Mission,
    RegisterRequest,
    Vehicle,
    VehicleCreate,
    VehicleUpdate,
    Warehouse,
    WarehouseCreate,
    WarehouseUpdate,
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


@router.patch("/{carrier_id}", response_model=CarrierProfile)
def update_carrier(carrier_id: str, data: CompanyUpdate):
    company = store.update_company(carrier_id, data.model_dump(exclude_unset=True))
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
def update_vehicle(carrier_id: str, vehicle_id: str, data: VehicleUpdate):
    """Partial vehicle edit (also used by the availability toggle)."""
    vehicle = store.update_vehicle(carrier_id, vehicle_id, data.model_dump(exclude_unset=True))
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Carrier or vehicle not found")
    return vehicle


@router.patch("/{carrier_id}/warehouses/{warehouse_id}", response_model=Warehouse)
def update_warehouse(carrier_id: str, warehouse_id: str, data: WarehouseUpdate):
    warehouse = store.update_warehouse(carrier_id, warehouse_id, data.model_dump(exclude_unset=True))
    if warehouse is None:
        raise HTTPException(status_code=404, detail="Carrier or warehouse not found")
    return warehouse


@router.get("/{carrier_id}/missions", response_model=list[Mission])
def get_missions(carrier_id: str):
    """Missions assigned to this carrier by coordinators (read-only)."""
    if store.get_company(carrier_id) is None:
        raise HTTPException(status_code=404, detail=f"Carrier {carrier_id} not found")
    return missions_store.get_missions(carrier_id)
