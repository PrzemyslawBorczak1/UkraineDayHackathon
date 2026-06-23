"""Allocation pipeline: DB -> engine dataclasses -> scheduler -> Task rows.

Builds engine objects from the backend models, runs the ALNS scheduler for a
single day, and persists the resulting schedule as Task rows via engine_adapter.

Units: the engine is fed tonnes / m³ directly (weight_t, payload_t, volume_m3).
The scheduler's capacity/allocation math is ratio-based, so allocated cargo
comes back in the same units the backend uses — no kg conversion needed.

Datetimes: engine assumes naive datetimes (uses datetime.combine internally),
so DB tz-aware values are converted to naive UTC before being passed in.
"""
from datetime import datetime, date, time, timedelta, timezone
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session
from geoalchemy2.shape import to_shape

from app.models import Mission, Vehicle, Carrier, Warehouse, Budget, PublicVerification
from app.models.mission import MissionStatus
from app.engine_adapter import persist_schedule
from app.allocation.engine import (
    Location, Temperature, Budget as EBudget, Priority, VehicleType,
    Carrier as ECarrier, Vehicle as EVehicle, Mission as EMission,
    Warehouses as EWarehouse, DailyALNSScheduler,
)

_VTYPE = {
    "Rigid truck": VehicleType.RIGID_TRUCK,
    "Standard semi": VehicleType.STANDARD_SEMI,
    "Van": VehicleType.VAN,
    "BDF swap body": VehicleType.BDF_SWAP_BODY,
    "Refrigerated semi": VehicleType.REFRIGERATED_SEMI,
}
_PRIORITY = {
    "Critical": Priority.HIGH,
    "High": Priority.HIGH,
    "Medium": Priority.MEDIUM,
    "Low": Priority.LOW,
}
_AVAILABLE = {"Available", "Available within 6h"}
_ALLOCATABLE = (MissionStatus.NEW, MissionStatus.ACCEPTED)


def _loc(geom) -> Location:
    p = to_shape(geom)
    return Location(latitude=p.y, longitude=p.x)


# Dataset datetimes are all ISO 8601 with a +02:00 offset (CEST, Polish local
# time). The engine works with naive datetimes, so we normalise to this local
# offset and drop tzinfo — preserving the authored wall-clock (NOT converting to
# UTC, which would shift times by 2h and could misbucket missions by day).
_LOCAL_TZ = timezone(timedelta(hours=2))


def _naive(dt: Optional[datetime]) -> Optional[datetime]:
    """Local (CEST) wall-clock as a naive datetime, for the engine."""
    if dt is None:
        return None
    if dt.tzinfo is not None:
        dt = dt.astimezone(_LOCAL_TZ).replace(tzinfo=None)
    return dt


def _incident_score(incidents: int) -> float:
    return max(0.0, 100.0 - incidents * 25.0)


def _resilience(carrier: Carrier, has_247: bool) -> float:
    score = 0.0
    if carrier.documentation_status == "Complete":
        score += 33
    if carrier.preferred_contact_channel in ("EDI gateway", "Web portal"):
        score += 34
    if has_247:
        score += 33
    return score


def _build_carriers(db: Session):
    """Returns (ecarriers_by_id, do_not_use_ids)."""
    verifications = {v.carrier_id: v for v in db.query(PublicVerification).all()}
    carriers_247 = {
        cid for (cid,) in db.query(Warehouse.carrier_id)
        .filter(Warehouse.operating_hours == "24/7").distinct()
    }

    ecarriers, do_not_use = {}, set()
    for c in db.query(Carrier).all():
        ver = verifications.get(c.id)
        if ver and ver.verification_result == "Do not use":
            do_not_use.add(c.id)
        ecarriers[c.id] = ECarrier(
            id=c.id,
            location=_loc(c.hq_geom),
            price_per_km=c.cost_per_km,
            reliability_score=c.reliability_score,
            public_verification_score=ver.public_verification_score if ver else 0.0,
            incident_score=_incident_score(ver.incidents_24m if ver else 0),
            operational_resilience=_resilience(c, c.id in carriers_247),
        )
    return ecarriers, do_not_use


def _build_vehicles(db: Session, ecarriers, do_not_use) -> list[EVehicle]:
    vehicles = []
    for v in db.query(Vehicle).all():
        if v.availability_status not in _AVAILABLE:
            continue
        if v.carrier_id in do_not_use:  # hard filter: Do Not Use carriers
            continue
        vtype = _VTYPE.get(v.vehicle_type)
        carrier = ecarriers.get(v.carrier_id)
        if vtype is None or carrier is None:
            continue
        vehicles.append(EVehicle(
            id=v.id,
            carrier=carrier,
            vehicle_type=vtype,
            is_temperature_controlled=v.temperature_controlled,
            is_adr_enabled=v.adr_enabled,
            is_lift_gate_enabled=v.liftgate,
            activation_time=v.activation_time_hours,
            weight_capacity=v.payload_t,
            volume_capacity=v.volume_m3,
        ))
    return vehicles


def _synthetic_warehouse(prefix: str, mission: Mission, geom) -> EWarehouse:
    # Synthetic warehouse for a mission endpoint (24/7, instant) until real
    # origin/destination warehouses are wired in.
    return EWarehouse(
        id=f"{prefix}:{mission.id}",
        location=_loc(geom),
        opening_hours=time(0, 0),
        closing_hours=time(23, 59, 59),
        is_active=True,
        activation_time=2.0,
    )


def _build_missions(db: Session, window_start: datetime, window_end: datetime) -> list[EMission]:
    rows = (
        db.query(Mission)
        .filter(Mission.status.in_(_ALLOCATABLE))
        .all()
    )
    missions = []
    for m in rows:
        af, dl = _naive(m.available_from), _naive(m.deadline)
        if af is None or dl is None:
            continue
        # Keep only missions whose [available_from, deadline] OVERLAPS the window
        # [window_start, window_end): drop those ending before it (dl < start) or
        # starting after it (af >= end).
        if dl < window_start or af >= window_end:
            continue
        temp = None
        if m.required_temperature:
            temp = Temperature(min=m.required_temperature[0], max=m.required_temperature[1])
        missions.append(EMission(
            id=m.id,
            origin=_synthetic_warehouse("o", m, m.origin_geom),
            destination=_synthetic_warehouse("d", m, m.dest_geom),
            priority=_PRIORITY.get(m.priority, Priority.LOW),
            available_from=af,
            deadline=dl,
            weight=m.weight_t,
            volume=m.volume_m3,
            route_distance=m.route_distance_km,
            temperature_required=temp,
            adr_required=m.certificate_adr,
            lift_gate_required=m.liftgate,
            required_vehicle_type=_VTYPE.get(m.required_vehicle_type),
        ))
    return missions


def _daily_budget(db: Session) -> EBudget:
    rows = {b.period: b.budget_ceiling for b in db.query(Budget).all()}
    return EBudget(
        daily=rows.get("Daily", float("inf")),
        weekly=rows.get("Weekly", float("inf")),
        monthly=rows.get("Monthly (~4.35 weeks)", float("inf")),
    )


def run_allocation(
    db: Session, day: Optional[date] = None, iterations: int = 2,
    days: Optional[int] = None,
) -> dict:
    """Run allocation and persist the schedule as Tasks.

    `day` defaults to **today (now)** — only missions relevant in
    `[now, now + days]` are fed to the engine (historical/expired ones are
    dropped). `days` is the window length; **None = from now to the latest
    deadline**. More `iterations` / a wider window = better (and slower)
    schedule. Returns a summary dict.
    """
    bounds = (
        db.query(func.min(Mission.available_from), func.max(Mission.deadline))
        .filter(Mission.status.in_(_ALLOCATABLE))
        .one()
    )
    earliest, latest = bounds
    if earliest is None:
        return {"day": None, "days": days, "iterations": iterations,
                "tasks_created": 0, "missions_considered": 0,
                "missions_assigned": 0, "vehicles_used": 0}

    # Default window starts at *now* (CEST naive frame, matching mission times):
    # we only schedule missions relevant in [now, now + days], not historical ones.
    now = _naive(datetime.now(timezone.utc))
    if day is None:
        day = now.date()
    window_start = datetime.combine(day, time(0, 0))
    if days is None:
        # Full span from the window start to the latest deadline.
        window_end = max(_naive(latest), window_start) + timedelta(days=1)
    else:
        window_end = window_start + timedelta(days=max(1, days))

    ecarriers, do_not_use = _build_carriers(db)
    vehicles = _build_vehicles(db, ecarriers, do_not_use)
    missions = _build_missions(db, window_start, window_end)
    budget = _daily_budget(db)

    scheduler = DailyALNSScheduler(vehicles=vehicles, missions=missions, budget=budget)
    scheduler.run_alns(
        iterations=iterations,
        start_date=window_start,
        end_date=window_end,
        simulation_time=window_start,
    )

    tasks = persist_schedule(db, vehicles)
    _reflect_assignment_on_missions(db, tasks)

    assigned = {t.mission_id for t in tasks}
    used = {t.vehicle_id for t in tasks}
    return {
        "day": day.isoformat(),
        "days": days,
        "iterations": iterations,
        "tasks_created": len(tasks),
        "missions_considered": len(missions),
        "missions_assigned": len(assigned),
        "vehicles_used": len(used),
    }


def _reflect_assignment_on_missions(db: Session, tasks) -> None:
    """Fill mission.assigned_vehicle/carrier and flip status to IN_PROGRESS so the
    coordinator map shows real carriers + convoys."""
    veh_carrier = dict(db.query(Vehicle.id, Vehicle.carrier_id).all())
    seen: set[str] = set()
    for t in tasks:
        if t.mission_id in seen:
            continue
        seen.add(t.mission_id)
        m = db.query(Mission).filter(Mission.id == t.mission_id).first()
        if m is not None:
            m.assigned_vehicle_id = t.vehicle_id
            m.assigned_carrier_id = veh_carrier.get(t.vehicle_id)
            m.status = MissionStatus.IN_PROGRESS
    db.commit()
