"""Adapter: allocation-engine schedule -> backend Task rows.

The engine (engine/main.py) plans each vehicle's day as a list of *intervals*
(`TimeInterval`). Each interval carries a phase (`Status`), a time window
(`start`/`end`), a `MissionAssignment` (mission + allocated cargo) and an
`is_delivery_trip` flag. The backend names the same thing a **Task** with a
`status` phase, `start_date`/`end_date`, `mission_id` and `allocated_*` cargo.

This module maps engine intervals to Task instances. It is duck-typed — it
reads attributes off the engine objects, so the engine package does not need to
be importable from the backend.

Expected interval shape:
    interval.start / interval.end                 -> datetimes
    interval.status (enum with `.name`)           -> phase
    interval.mission_assignment.mission.id         -> str
    interval.mission_assignment.allocated_weight   -> float
    interval.mission_assignment.allocated_volume   -> float
"""
from typing import Optional

from app.models import Task
from app.models.task import TaskStatus


# Engine Status.name -> Task phase.
_PHASE_BY_STATUS = {
    "IN_PROGRESS_PASSIVE": TaskStatus.TRAVELING,    # driving empty to origin
    "IN_PROGRESS_ACTIVE": TaskStatus.TRANSPORTING,  # driving with cargo
    "UNLOADING": TaskStatus.UNLOAD,                 # unloading
    "ACTIVE_WAITING": TaskStatus.PREPARE_UNLOAD,    # waiting with cargo before unload
    "PASSIVE_WAITING": TaskStatus.WAIT,             # waiting, no cargo
}


def map_phase(status_name: str) -> str:
    """Map an engine interval phase to a Task status."""
    return _PHASE_BY_STATUS.get(status_name, TaskStatus.WAIT)


def task_from_interval(vehicle_id: str, interval) -> Optional[Task]:
    """Build a Task from one engine interval, or None if it has no assignment."""
    assignment = getattr(interval, "mission_assignment", None)
    if assignment is None:
        return None
    status = getattr(interval, "status", None)
    status_name = getattr(status, "name", str(status))
    return Task(
        vehicle_id=vehicle_id,
        mission_id=assignment.mission.id,
        status=map_phase(status_name),
        start_date=interval.start,
        end_date=interval.end,
        allocated_weight=assignment.allocated_weight,
        allocated_volume=assignment.allocated_volume,
    )


def tasks_from_vehicle(vehicle) -> list[Task]:
    """All Tasks for one engine Vehicle's schedule, in chronological order."""
    intervals = sorted(vehicle.timeSchedule, key=lambda iv: iv.start)
    tasks = [task_from_interval(vehicle.id, iv) for iv in intervals]
    return [t for t in tasks if t is not None]


def persist_schedule(db, vehicles, *, replace: bool = True) -> list[Task]:
    """Write the engine schedule (list of vehicles) as Task rows.

    When `replace` is True, existing tasks are cleared first so re-running the
    scheduler is idempotent.
    """
    if replace:
        db.query(Task).delete()
    tasks: list[Task] = []
    for vehicle in vehicles:
        tasks.extend(tasks_from_vehicle(vehicle))
    db.add_all(tasks)
    db.commit()
    return tasks
