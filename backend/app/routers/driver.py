"""Driver-facing endpoints (MVP, happy path).

These power the driver/field-operator flow. Work is tracked as Tasks (a part of
a mission assigned to one vehicle); task endpoints implicitly drive the parent
mission's state through the event log. Bodies are intentionally omitted for now —
richer payloads and stricter logic come later.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Vehicle, Task
from app.events import emit_event, EventType
from app.serialize import serialize, serialize_list

router = APIRouter(tags=["driver"])


@router.get("/tasks/{vehicle_id}")
def get_tasks_for_vehicle(vehicle_id: str, db: Session = Depends(get_db)):
    """List all tasks assigned to a given vehicle."""
    tasks = db.query(Task).filter(Task.vehicle_id == vehicle_id).all()
    return serialize_list(tasks)


@router.get("/vehicle/{vehicle_id}")
def get_vehicle(vehicle_id: str, db: Session = Depends(get_db)):
    """Return info about a vehicle."""
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if vehicle is None:
        raise HTTPException(status_code=404, detail=f"Vehicle {vehicle_id} not found")
    return serialize(vehicle)


@router.post("/incident/{task_id}")
def report_incident(task_id: int, db: Session = Depends(get_db)):
    """Report an incident for a task — implicitly faults the parent mission."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if task is None:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    event = emit_event(
        db,
        mission_id=task.mission_id,
        event_type=EventType.DRIVER_REPORT_FAULT,
        actor=f"vehicle:{task.vehicle_id}",
        payload={"task_id": task_id},
    )
    return serialize(event)


@router.patch("/tasks/{task_id}")
def update_task(task_id: int, db: Session = Depends(get_db)):
    """Update a task (MVP: mark delivered) — implicitly advances the mission."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if task is None:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    emit_event(
        db,
        mission_id=task.mission_id,
        event_type=EventType.DRIVER_DELIVERED,
        actor=f"vehicle:{task.vehicle_id}",
        payload={"task_id": task_id},
    )
    return serialize(task)
