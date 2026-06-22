"""Pydantic models for the carrier panel API."""
from typing import Optional

from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    """Lightweight data a company provides at registration.

    Deliberately company-level only — no per-vehicle fleet. Vehicles and
    warehouses are added later, after login.
    """
    name: str = Field(..., min_length=2)
    tax_id: str = Field(..., description="NIP, e.g. PL1234567890")
    hq_city: str
    voivodeship: str
    activity_type: str
    operating_region: str
    preferred_contact_channel: str
    declared_activation_time_hours: int = Field(..., ge=0, le=72)
    cost_per_km: float = Field(..., gt=0)


class VerificationFields(BaseModel):
    """The raw 'public-registry' data — real for seeded carriers, mocked for new ones."""
    company_registry_status: str
    transport_licence_status: str
    insurance_status: str
    tax_arrears: str
    sanctions_screening_result: str
    incidents_24m: int
    documentation_completeness_pct: int
    reliability_score: int


class Verification(BaseModel):
    status: str
    risk: str
    score: int
    triggered_rules: list[str]
    fields: VerificationFields


# --- Fleet & warehouses (Phase 2) -------------------------------------------

class Vehicle(BaseModel):
    id: str
    carrier_id: str
    vehicle_type: str
    gross_vehicle_weight_t: float
    payload_t: float
    volume_m3: int
    temperature_controlled: bool
    adr_enabled: bool
    liftgate: bool
    current_city: str
    availability_status: str
    activation_time_hours: int
    operational_range_km: int
    restriction_note: Optional[str] = None


class VehicleCreate(BaseModel):
    vehicle_type: str
    gross_vehicle_weight_t: float = Field(..., gt=0)
    payload_t: float = Field(..., gt=0)
    volume_m3: int = Field(..., gt=0)
    temperature_controlled: bool = False
    adr_enabled: bool = False
    liftgate: bool = False
    current_city: str
    activation_time_hours: int = Field(..., ge=0, le=72)
    operational_range_km: int = Field(..., gt=0)
    restriction_note: Optional[str] = None


class Warehouse(BaseModel):
    id: str
    carrier_id: str
    name: str
    city: str
    voivodeship: str
    warehouse_type: str
    area_m2: int
    dock_doors: int
    cold_storage: bool
    on_site_security: bool
    operating_hours: str
    available_capacity_pct: int
    availability_status: str
    activation_time_hours: int


class WarehouseCreate(BaseModel):
    name: str
    city: str
    voivodeship: str
    warehouse_type: str
    area_m2: int = Field(..., gt=0)
    dock_doors: int = Field(..., ge=0)
    cold_storage: bool = False
    on_site_security: bool = False
    operating_hours: str
    available_capacity_pct: int = Field(100, ge=0, le=100)
    activation_time_hours: int = Field(..., ge=0, le=72)


class VehicleUpdate(BaseModel):
    """Partial vehicle edit — only provided fields are applied."""
    vehicle_type: Optional[str] = None
    gross_vehicle_weight_t: Optional[float] = None
    payload_t: Optional[float] = None
    volume_m3: Optional[int] = None
    temperature_controlled: Optional[bool] = None
    adr_enabled: Optional[bool] = None
    liftgate: Optional[bool] = None
    current_city: Optional[str] = None
    activation_time_hours: Optional[int] = None
    operational_range_km: Optional[int] = None
    restriction_note: Optional[str] = None
    availability_status: Optional[str] = None


class WarehouseUpdate(BaseModel):
    """Partial warehouse edit — only provided fields are applied."""
    name: Optional[str] = None
    city: Optional[str] = None
    voivodeship: Optional[str] = None
    warehouse_type: Optional[str] = None
    area_m2: Optional[int] = None
    dock_doors: Optional[int] = None
    cold_storage: Optional[bool] = None
    on_site_security: Optional[bool] = None
    operating_hours: Optional[str] = None
    available_capacity_pct: Optional[int] = None
    activation_time_hours: Optional[int] = None


class CompanyUpdate(BaseModel):
    """Editable declared company fields (does not re-run verification)."""
    name: Optional[str] = None
    hq_city: Optional[str] = None
    voivodeship: Optional[str] = None
    activity_type: Optional[str] = None
    operating_region: Optional[str] = None
    preferred_contact_channel: Optional[str] = None
    declared_activation_time_hours: Optional[int] = None
    cost_per_km: Optional[float] = None


class CarrierProfile(BaseModel):
    id: str
    name: str
    tax_id: str
    hq_city: str
    voivodeship: str
    activity_type: str
    operating_region: str
    preferred_contact_channel: str
    declared_activation_time_hours: int
    cost_per_km: float
    carrier_risk_rating: Optional[str] = None  # only known for seeded carriers
    source: str  # "seed" | "registered"
    verification: Verification
    vehicles: list[Vehicle] = Field(default_factory=list)
    warehouses: list[Warehouse] = Field(default_factory=list)


class CarrierSummary(BaseModel):
    """Compact entry for the login / company-picker list."""
    id: str
    name: str
    tax_id: str
    status: str
    source: str
