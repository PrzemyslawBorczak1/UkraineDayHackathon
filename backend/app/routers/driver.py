"""Drivers App API (MVP) — implements API_SCHEME.md under /api/v1.

Happy-path implementation of the contract the frontend expects: login (by
vehicle id, no JWT), vehicle details, a vehicle's tasks, and incident reporting.
Task endpoints implicitly drive the parent mission's state via the event log.
"""
import re
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from geoalchemy2.shape import to_shape
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Vehicle, Mission, Task
from app.models.mission import MissionStatus
from app.events import emit_event, EventType

router = APIRouter(prefix="/api/v1", tags=["driver"])


# --------------------------------------------------------------------------- #
# Request models
# --------------------------------------------------------------------------- #
class LoginRequest(BaseModel):
    vehicle_id: str


class IncidentRequest(BaseModel):
    type: str  # "endMission" | "delay"
    delay_minutes: Optional[int] = None
    description: Optional[str] = None
    reported_at: str


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _iso_z(dt: Optional[datetime]) -> Optional[str]:
    """ISO 8601 in UTC with a trailing Z, or None."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _vehicle_features(v: Vehicle) -> list[str]:
    features: list[str] = []
    if v.temperature_controlled:
        features.append("Temperature control")
    if v.adr_enabled:
        features.append("ADR (hazmat) certified")
    if v.liftgate:
        features.append("Liftgate")
    return features


def _vehicle_restrictions(v: Vehicle) -> list[str]:
    if not v.restriction_note:
        return []
    return [s.strip() for s in re.split(r"[;]", v.restriction_note) if s.strip()]


def _point(geom) -> Optional[dict]:
    """PostGIS POINT -> {lat, lng}, or None."""
    if geom is None:
        return None
    p = to_shape(geom)
    return {"lat": p.y, "lng": p.x}


def _task_payload(task: Task) -> dict:
    """Task shaped for the driver app. Weight/volume/times come from the task's
    own interval (allocated cargo + time window); origin/destination/cargo_type
    from the parent mission; vehicle + carrier from task.vehicle.carrier."""
    m = task.mission
    v = task.vehicle
    carrier = v.carrier if v is not None else None
    special = [m.special_requirement] if m.special_requirement else []
    return {
        "id": task.id,
        "mission_id": m.id,
        "vehicle_id": task.vehicle_id,
        "vehicle_type": v.vehicle_type if v is not None else None,
        "carrier_id": v.carrier_id if v is not None else None,
        "carrier_name": carrier.name if carrier is not None else None,
        "cargo_type": m.cargo_type,
        "start_time": _iso_z(task.start_date or m.available_from),
        "end_time": _iso_z(task.end_date or m.deadline),
        "origin": m.origin_point,
        "origin_address": m.origin_address,
        "origin_coordinates": _point(m.origin_geom),
        "destination": m.destination_point,
        "destination_address": m.dest_address,
        "destination_coordinates": _point(m.dest_geom),
        # Explicit start/end of the task (currently the mission origin/destination).
        "start_address": m.origin_address,
        "start_coordinates": _point(m.origin_geom),
        "end_address": m.dest_address,
        "end_coordinates": _point(m.dest_geom),
        "weight": task.allocated_weight if task.allocated_weight is not None else m.weight_t,
        "volume": task.allocated_volume if task.allocated_volume is not None else m.volume_m3,
        "special_requirements": special,
        "unloading_wait_minutes": None,  # task-level metadata, added later
        "is_current": m.status == MissionStatus.IN_PROGRESS,
    }


# --------------------------------------------------------------------------- #
# Auth
# --------------------------------------------------------------------------- #
@router.post("/auth/login")
def login(body: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate a driver by vehicle id (MVP: existence check only)."""
    vehicle = db.query(Vehicle).filter(Vehicle.id == body.vehicle_id).first()
    if vehicle is None:
        return JSONResponse(
            status_code=401,
            content={"success": False, "error_message": "Invalid credentials"},
        )
    return {"success": True, "vehicle_id": vehicle.id}


# --------------------------------------------------------------------------- #
# Vehicles
# --------------------------------------------------------------------------- #
@router.get("/vehicles/{vehicle_id}")
def get_vehicle(vehicle_id: str, db: Session = Depends(get_db)):
    """Retrieve details for a specific vehicle."""
    v = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if v is None:
        raise HTTPException(status_code=404, detail=f"Vehicle {vehicle_id} does not exist")
    return {
        "vehicle_id": v.id,
        "type": v.vehicle_type,
        "weight": v.gvw_t,
        "payload": v.payload_t,
        "volume": v.volume_m3,
        "operational_range": v.operational_range_km,
        "features": _vehicle_features(v),
        "restrictions": _vehicle_restrictions(v),
    }


# --------------------------------------------------------------------------- #
# Tasks
# --------------------------------------------------------------------------- #
@router.get("/vehicles/{vehicle_id}/tasks")
def get_vehicle_tasks(vehicle_id: str, db: Session = Depends(get_db)):
    """Retrieve all tasks assigned to a vehicle (with mission + vehicle/carrier)."""
    tasks = (
        db.query(Task)
        .filter(Task.vehicle_id == vehicle_id)
        .options(
            joinedload(Task.mission),
            joinedload(Task.vehicle).joinedload(Vehicle.carrier),
        )
        .all()
    )
    return [_task_payload(t) for t in tasks]


@router.patch("/tasks/{task_id}")
def finish_task(task_id: int, db: Session = Depends(get_db)):
    """Mark a task as finished — implicitly delivers the parent mission."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if task is None:
        raise HTTPException(status_code=404, detail=f"Task {task_id} does not exist")
    emit_event(
        db,
        mission_id=task.mission_id,
        event_type=EventType.DRIVER_DELIVERED,
        actor=f"vehicle:{task.vehicle_id}",
        payload={"task_id": task_id},
    )
    db.refresh(task)
    return _task_payload(task)


# --------------------------------------------------------------------------- #
# Incidents
# --------------------------------------------------------------------------- #
@router.post("/tasks/{task_id}/incidents", status_code=201)
def report_incident(task_id: int, body: IncidentRequest, db: Session = Depends(get_db)):
    """Report an incident on a task (endMission | delay)."""
    if body.type not in ("endMission", "delay"):
        raise HTTPException(status_code=400, detail=f"Unknown incident type '{body.type}'")
    if body.type == "delay" and body.delay_minutes is None:
        raise HTTPException(status_code=400, detail="delay_minutes is required for delay")

    task = db.query(Task).filter(Task.id == task_id).first()
    if task is None:
        raise HTTPException(status_code=404, detail=f"Task {task_id} does not exist")

    event_type = (
        EventType.DRIVER_DELIVERED
        if body.type == "endMission"
        else EventType.CARRIER_REPORT_DELAY
    )
    event = emit_event(
        db,
        mission_id=task.mission_id,
        event_type=event_type,
        actor=f"vehicle:{task.vehicle_id}",
        payload={
            "task_id": task_id,
            "incident_type": body.type,
            "delay_minutes": body.delay_minutes,
            "description": body.description,
            "reported_at": body.reported_at,
        },
    )

    return {
        "id": f"INC-{event.id:03d}",
        "task_id": task_id,
        "mission_id": task.mission_id,
        "type": body.type,
        "delay_minutes": body.delay_minutes,
        "description": body.description,
        "reported_at": body.reported_at,
    }
