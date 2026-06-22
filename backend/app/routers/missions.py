"""Mission endpoints (coordinator side).

MVP: create a mission. Structured requirements (temperature / ADR / liftgate)
are parsed from the special_requirement note, same as the CSV loader.
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from shapely.geometry import Point
from geoalchemy2.shape import from_shape
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Mission
from app.models.mission import MissionStatus
from app.load import parse_requirements
from app.serialize import serialize

router = APIRouter(prefix="/api/v1", tags=["missions"])


class MissionCreate(BaseModel):
    id: Optional[str] = None  # auto-generated (M0001 style) when omitted
    cargo_type: str
    origin_point: str
    origin_lat: float
    origin_lng: float
    origin_address: Optional[str] = None
    destination_point: str
    dest_lat: float
    dest_lng: float
    dest_address: Optional[str] = None
    route_distance_km: int
    weight_t: float
    volume_m3: float
    required_vehicle_type: str
    priority: str
    available_from: datetime
    deadline: datetime
    estimated_cost: float
    requesting_authority: str
    special_requirement: Optional[str] = None


def _next_mission_id(db: Session) -> str:
    last = db.query(Mission.id).order_by(Mission.id.desc()).first()
    if last is None:
        return "M0001"
    return f"M{int(last[0][1:]) + 1:04d}"


@router.post("/missions", status_code=201)
def create_mission(body: MissionCreate, db: Session = Depends(get_db)):
    """Create a new mission (status NEW)."""
    mission_id = body.id or _next_mission_id(db)
    if db.query(Mission).filter(Mission.id == mission_id).first() is not None:
        raise HTTPException(status_code=409, detail=f"Mission {mission_id} already exists")

    temp_range, certificate_adr, liftgate = parse_requirements(body.special_requirement)

    mission = Mission(
        id=mission_id,
        cargo_type=body.cargo_type,
        origin_point=body.origin_point,
        origin_geom=from_shape(Point(body.origin_lng, body.origin_lat), srid=4326),
        origin_address=body.origin_address,
        destination_point=body.destination_point,
        dest_geom=from_shape(Point(body.dest_lng, body.dest_lat), srid=4326),
        dest_address=body.dest_address,
        route_distance_km=body.route_distance_km,
        weight_t=body.weight_t,
        volume_m3=body.volume_m3,
        required_vehicle_type=body.required_vehicle_type,
        priority=body.priority,
        available_from=body.available_from,
        deadline=body.deadline,
        estimated_cost=body.estimated_cost,
        status=MissionStatus.NEW,
        requesting_authority=body.requesting_authority,
        special_requirement=body.special_requirement,
        required_temperature=temp_range,
        certificate_adr=certificate_adr,
        liftgate=liftgate,
    )
    db.add(mission)
    db.commit()
    db.refresh(mission)
    return serialize(mission)
