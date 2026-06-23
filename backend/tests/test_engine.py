"""Unit tests that actually run the vendored ALNS engine on a tiny scenario."""
import random
from datetime import datetime, timedelta, time

from app.allocation.engine import (
    Location, Carrier, Budget, Warehouses, Vehicle, Mission,
    VehicleType, Priority, State, DailyALNSScheduler,
)
from app.engine_adapter import tasks_from_vehicle
from app.models.task import TaskStatus


def _scenario():
    """One vehicle, one feasible mission, plenty of budget/capacity."""
    wh_a = Warehouses("WH_A", Location(50.45, 30.52), time(0, 0), time(23, 59, 59), True, 1.0)
    wh_b = Warehouses("WH_B", Location(49.83, 24.02), time(0, 0), time(23, 59, 59), True, 1.0)
    carrier = Carrier(
        "C01", Location(50.45, 30.52), price_per_km=2.0, reliability_score=90,
        public_verification_score=95.0, incident_score=100.0, operational_resilience=100.0,
    )
    vehicle = Vehicle(
        "V01", carrier, VehicleType.VAN, False, False, False, 1.0,
        weight_capacity=10.0, volume_capacity=20.0,
    )
    start = datetime(2026, 7, 11, 0, 0)
    mission = Mission(
        "M01", wh_a, wh_b, Priority.HIGH,
        start + timedelta(hours=5), start + timedelta(days=3),
        weight=5.0, volume=8.0, route_distance=200.0,
        required_vehicle_type=VehicleType.VAN,
    )
    budget = Budget(daily=100000.0, weekly=700000.0, monthly=3000000.0)
    return [vehicle], [mission], budget, start


def _run(iterations):
    random.seed(0)
    vehicles, missions, budget, start = _scenario()
    scheduler = DailyALNSScheduler(vehicles=vehicles, missions=missions, budget=budget)
    scheduler.run_alns(
        iterations=iterations,
        start_date=start,
        end_date=start + timedelta(days=3),
        simulation_time=start,
    )
    return vehicles, missions


def test_engine_assigns_feasible_mission():
    vehicles, missions = _run(iterations=2)
    mission = missions[0]
    assert mission.state == State.CLOSED            # fully assigned
    assert mission.remaining_weight <= 0.01
    assert vehicles[0].timeSchedule                 # schedule populated
    assert "V01" in mission.assigned_vehicles


def test_engine_respects_budget():
    # Zero budget -> nothing can be funded -> no assignment.
    random.seed(0)
    vehicles, missions, _, start = _scenario()
    scheduler = DailyALNSScheduler(vehicles=vehicles, missions=missions, budget=Budget(0.0, 0.0, 0.0))
    scheduler.run_alns(iterations=1, start_date=start, end_date=start + timedelta(days=3),
                       simulation_time=start)
    assert missions[0].state == State.CREATED
    assert not vehicles[0].timeSchedule


def test_engine_schedule_maps_to_tasks():
    vehicles, _ = _run(iterations=1)
    tasks = tasks_from_vehicle(vehicles[0])

    assert tasks
    valid = {
        TaskStatus.TRAVELING, TaskStatus.TRANSPORTING,
        TaskStatus.UNLOAD, TaskStatus.PREPARE_UNLOAD, TaskStatus.WAIT,
    }
    assert all(t.status in valid for t in tasks)
    assert all(t.mission_id == "M01" for t in tasks)
    assert all(t.vehicle_id == "V01" for t in tasks)
    # the loaded delivery leg must be present
    assert any(t.status == TaskStatus.TRANSPORTING for t in tasks)
    # tasks carry the allocated cargo
    assert all(t.allocated_weight is not None for t in tasks)
