"""Pydantic schemas for the carrier panel API.

Response models use from_attributes=True to be built directly from SQLAlchemy
model instances. Field names match the DB columns exactly.
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Request models (input validation only)
# ---------------------------------------------------------------------------

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2)
    tax_id: str = Field(..., description="NIP, e.g. PL1234567890")
    hq_city: str
    voivodeship: str
    activity_type: str
    operating_region: str
    preferred_contact_channel: str
    declared_activation_time_hours: int = Field(..., ge=0, le=72)
    cost_per_km: float = Field(..., gt=0)


class VehicleCreate(BaseModel):
    vehicle_type: str
    gvw_t: float = Field(..., gt=0)
    payload_t: float = Field(..., gt=0)
    volume_m3: int = Field(..., gt=0)
    temperature_controlled: bool = False
    adr_enabled: bool = False
    liftgate: bool = False
    current_city: str
    activation_time_hours: int = Field(..., ge=0, le=72)
    operational_range_km: int = Field(..., gt=0)
    restriction_note: Optional[str] = None


class VehicleUpdate(BaseModel):
    vehicle_type: Optional[str] = None
    gvw_t: Optional[float] = None
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


class WarehouseUpdate(BaseModel):
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
    availability_status: Optional[str] = None


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    hq_city: Optional[str] = None
    voivodeship: Optional[str] = None
    activity_type: Optional[str] = None
    operating_region: Optional[str] = None
    preferred_contact_channel: Optional[str] = None
    declared_activation_time_hours: Optional[int] = None
    cost_per_km: Optional[float] = None


# ---------------------------------------------------------------------------
# Response models — mirror DB models 1:1
# ---------------------------------------------------------------------------

class VehicleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    carrier_id: str
    vehicle_type: str
    gvw_t: float
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


class WarehouseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

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


class PublicVerificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    company_registry_status: str
    transport_licence_status: str
    insurance_status: str
    tax_arrears: str
    sanctions_screening_result: str
    registry_match_quality: str
    incidents_24m: int
    documentation_completeness_pct: int
    public_verification_score: int
    verification_result: str
    verification_notes: Optional[str] = None


class CarrierOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    tax_id: str
    hq_city: str
    voivodeship: str
    activity_type: str
    declared_fleet_size: int
    declared_warehouse_capacity_m2: int
    crisis_participation_status: str
    documentation_status: str
    declared_activation_time_hours: int
    reliability_score: int
    risk_rating: str
    cost_per_km: float
    preferred_contact_channel: str
    operating_region: str
    vehicles: list[VehicleOut] = Field(default_factory=list)
    warehouses: list[WarehouseOut] = Field(default_factory=list)
    verification: Optional[PublicVerificationOut] = None


class CarrierSummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    tax_id: str
    crisis_participation_status: str
    risk_rating: str


# ---------------------------------------------------------------------------
# Mission + Task response models — mirror DB models
# ---------------------------------------------------------------------------

class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vehicle_id: str
    mission_id: str
    status: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    allocated_weight: Optional[float] = None
    allocated_volume: Optional[float] = None


class MissionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    cargo_type: str
    origin_point: str
    destination_point: str
    route_distance_km: int
    weight_t: float
    volume_m3: float
    required_vehicle_type: str
    priority: str
    available_from: datetime
    deadline: datetime
    estimated_cost: float
    status: str
    requesting_authority: str
    special_requirement: Optional[str] = None
    certificate_adr: bool
    liftgate: bool
    assigned_vehicle_id: Optional[str] = None
    assigned_carrier_id: Optional[str] = None
    assignment_score: Optional[float] = None
    # Coordinates extracted from PostGIS geometry
    origin_lat: Optional[float] = None
    origin_lng: Optional[float] = None
    dest_lat: Optional[float] = None
    dest_lng: Optional[float] = None
    # In-memory acceptance decision — not stored in DB
    acceptance_status: str = "Pending"
    tasks: list[TaskOut] = Field(default_factory=list)
