"""Mission endpoints (coordinator side).

Create a mission, list missions, and serve animation payloads (route + vehicles
+ time window) the coordinator map uses to play convoys along the timeline.
Structured requirements (temperature / ADR / liftgate) are parsed from the
special_requirement note, same as the CSV loader.
"""
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from shapely.geometry import Point
from geoalchemy2.shape import from_shape, to_shape
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Mission, Warehouse
from app.models.mission import MissionStatus
from app.load import parse_requirements
from app.serialize import serialize

router = APIRouter(prefix="/api/v1", tags=["missions"])


# --------------------------------------------------------------------------- #
# Serialization helpers (shaped to match the frontend mission types)
# --------------------------------------------------------------------------- #
def _iso_z(dt: Optional[datetime]) -> Optional[str]:
    """ISO 8601 in UTC with a trailing Z, or None."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _latlng(geom) -> Optional[list[float]]:
    """PostGIS POINT -> [lat, lng], or None."""
    if geom is None:
        return None
    p = to_shape(geom)
    return [p.y, p.x]


def _route_coords(m: Mission) -> list[list[float]]:
    """Route as [[lat, lng], ...]. Uses route_geom when present, else a straight
    origin -> destination line (the router provider hasn't filled route_geom yet)."""
    if m.route_geom is not None:
        line = to_shape(m.route_geom)
        return [[lat, lng] for lng, lat in line.coords]
    origin = _latlng(m.origin_geom)
    dest = _latlng(m.dest_geom)
    return [c for c in (origin, dest) if c is not None]


def _carrier_name(carrier_id: Optional[str], db: Session, cache: dict) -> str:
    if not carrier_id or carrier_id == "UNASSIGNED":
        return "Unassigned"
    if carrier_id not in cache:
        c = db.query(Carrier).filter(Carrier.id == carrier_id).first()
        cache[carrier_id] = c.name if c else carrier_id
    return cache[carrier_id]


def _mission_vehicles(m: Mission, db: Session) -> list[dict]:
    """Vehicles driving the mission. Prefers task assignments, then the mission's
    assigned vehicle, and finally synthesizes one so the convoy still animates."""
    route = _route_coords(m)
    tasks = db.query(Task).filter(Task.mission_id == m.id).all()
    vehicles = [
        {"id": t.vehicle.id, "vehicle_type": t.vehicle.vehicle_type,
         "carrier_id": t.vehicle.carrier_id, "route": route}
        for t in tasks
        if t.vehicle is not None
    ]
    if vehicles:
        return vehicles

    if m.assigned_vehicle_id:
        v = db.query(Vehicle).filter(Vehicle.id == m.assigned_vehicle_id).first()
        if v is not None:
            return [{"id": v.id, "vehicle_type": v.vehicle_type,
                     "carrier_id": v.carrier_id, "route": route}]

    return [{
        "id": f"{m.id}-V1",
        "vehicle_type": m.required_vehicle_type,
        "carrier_id": m.assigned_carrier_id or "UNASSIGNED",
        "route": route,
    }]


def _list_item(m: Mission, db: Session, cache: dict) -> dict:
    carrier_id = m.assigned_carrier_id or "UNASSIGNED"
    return {
        "id": m.id,
        "cargo_type": m.cargo_type,
        "carrier_id": carrier_id,
        "carrier_name": _carrier_name(carrier_id, db, cache),
        "origin_point": m.origin_point,
        "destination_point": m.destination_point,
        "priority": m.priority,
        "status": m.status,
    }


def _animation(m: Mission, db: Session, cache: dict) -> dict:
    carrier_id = m.assigned_carrier_id or "UNASSIGNED"
    return {
        "id": m.id,
        "cargo_type": m.cargo_type,
        "carrier_id": carrier_id,
        "carrier_name": _carrier_name(carrier_id, db, cache),
        "origin_point": m.origin_point,
        "destination_point": m.destination_point,
        "origin": _latlng(m.origin_geom),
        "destination": _latlng(m.dest_geom),
        "start": _iso_z(m.available_from),
        "end": _iso_z(m.deadline),
        "priority": m.priority,
        "status": m.status,
        "vehicles": _mission_vehicles(m, db),
    }


class MissionCreate(BaseModel):
    id: Optional[str] = None  # auto-generated (M0001 style) when omitted
    cargo_type: str
    origin_warehouse_id: str  # origin = this warehouse (point/geom/address derived)
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


@router.get("/missions")
def list_missions(
    db: Session = Depends(get_db),
    limit: int = Query(60, ge=1, le=500),
    status: Optional[str] = None,
):
    """List missions (lean shape for the rail + filtering)."""
    q = db.query(Mission)
    if status:
        q = q.filter(Mission.status == status)
    missions = q.order_by(Mission.id).limit(limit).all()
    cache: dict = {}
    return [_list_item(m, db, cache) for m in missions]


@router.get("/missions/animations")
def list_mission_animations(
    db: Session = Depends(get_db),
    limit: int = Query(30, ge=1, le=200),
    status: Optional[str] = None,
):
    """Full payloads (route + vehicles + window) for the timeline animation."""
    q = db.query(Mission)
    if status:
        q = q.filter(Mission.status == status)
    missions = q.order_by(Mission.id).limit(limit).all()
    cache: dict = {}
    return [_animation(m, db, cache) for m in missions]


@router.get("/missions/{mission_id}")
def get_mission(mission_id: str, db: Session = Depends(get_db)):
    """Full animation payload for a single mission."""
    m = db.query(Mission).filter(Mission.id == mission_id).first()
    if m is None:
        raise HTTPException(status_code=404, detail=f"Mission {mission_id} does not exist")
    return _animation(m, db, {})


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

    warehouse = db.query(Warehouse).filter(Warehouse.id == body.origin_warehouse_id).first()
    if warehouse is None:
        raise HTTPException(
            status_code=404, detail=f"Warehouse {body.origin_warehouse_id} does not exist"
        )

    temp_range, certificate_adr, liftgate = parse_requirements(body.special_requirement)

    origin_pt = to_shape(warehouse.geom)
    mission = Mission(
        id=mission_id,
        cargo_type=body.cargo_type,
        origin_point=warehouse.city,
        origin_geom=from_shape(Point(origin_pt.x, origin_pt.y), srid=4326),
        origin_address=warehouse.name,
        origin_warehouse_id=warehouse.id,
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
