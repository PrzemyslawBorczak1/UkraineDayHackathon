"""Minimal happy-path unit tests for pure logic (no database needed)."""
from datetime import datetime, timezone

from shapely.geometry import Point
from geoalchemy2.shape import from_shape

from app.load import parse_requirements
from app.models import Mission, Vehicle, Task, Budget
from app.models.mission import MissionStatus
from app.events import EventType
from app.events.transitions import STATE_TRANSITIONS
from app.serialize import serialize
from app.routers import driver
from app.routers import warehouses
from app.models import Warehouse


# --------------------------------------------------------------------------- #
# load.parse_requirements
# --------------------------------------------------------------------------- #
def test_parse_requirements_temperature():
    assert parse_requirements("Temperature 2-8°C required") == ([2, 8], False, False)


def test_parse_requirements_adr_and_hazmat():
    assert parse_requirements("ADR certified vehicle required") == (None, True, False)
    assert parse_requirements("Hazmat documentation required") == (None, True, False)


def test_parse_requirements_liftgate():
    assert parse_requirements("Liftgate required for unloading") == (None, False, True)


def test_parse_requirements_none_and_irrelevant():
    assert parse_requirements(None) == (None, False, False)
    assert parse_requirements("Requires police escort in crisis zone") == (None, False, False)


# --------------------------------------------------------------------------- #
# driver helpers
# --------------------------------------------------------------------------- #
def test_iso_z_formats_utc():
    dt = datetime(2026, 6, 22, 16, 0, tzinfo=timezone.utc)
    assert driver._iso_z(dt) == "2026-06-22T16:00:00Z"
    assert driver._iso_z(None) is None


def test_vehicle_features_and_restrictions():
    v = Vehicle(
        temperature_controlled=True,
        adr_enabled=False,
        liftgate=True,
        restriction_note="No city centre; ADR class limited",
    )
    assert driver._vehicle_features(v) == ["Temperature control", "Liftgate"]
    assert driver._vehicle_restrictions(v) == ["No city centre", "ADR class limited"]


def test_point_helper():
    geom = from_shape(Point(17.0, 51.0), srid=4326)  # (lng, lat)
    assert driver._point(geom) == {"lat": 51.0, "lng": 17.0}
    assert driver._point(None) is None


def _make_mission() -> Mission:
    return Mission(
        id="M0001",
        cargo_type="Food",
        origin_point="Warszawa",
        origin_address="ul. Testowa 1",
        origin_geom=from_shape(Point(21.0, 52.2), srid=4326),
        destination_point="Opole",
        dest_address="ul. Docelowa 2",
        dest_geom=from_shape(Point(17.93, 50.67), srid=4326),
        weight_t=20.0,
        volume_m3=40.0,
        special_requirement="Temperature 2-8°C required",
        available_from=datetime(2026, 6, 22, 16, 0, tzinfo=timezone.utc),
        deadline=datetime(2026, 6, 22, 22, 0, tzinfo=timezone.utc),
        status=MissionStatus.IN_TRANSIT,
    )


def test_task_payload_shape():
    mission = _make_mission()
    task = Task(id=1, vehicle_id="V0001", mission_id="M0001")
    task.mission = mission

    payload = driver._task_payload(task)

    assert payload["id"] == 1
    assert payload["mission_id"] == "M0001"
    assert payload["origin_coordinates"] == {"lat": 52.2, "lng": 21.0}
    assert payload["destination_coordinates"] == {"lat": 50.67, "lng": 17.93}
    assert payload["origin_address"] == "ul. Testowa 1"
    assert payload["destination_address"] == "ul. Docelowa 2"
    assert payload["special_requirements"] == ["Temperature 2-8°C required"]
    assert payload["is_current"] is True


# --------------------------------------------------------------------------- #
# serialize
# --------------------------------------------------------------------------- #
def test_serialize_point_geometry():
    mission = _make_mission()
    data = serialize(mission)
    assert data["origin_geom"] == {"lat": 52.2, "lng": 21.0}
    assert data["available_from"] == "2026-06-22T16:00:00+00:00"
    assert data["route_geom"] is None


def test_serialize_plain_model():
    b = Budget(period="Weekly", budget_ceiling=2500000.0, estimated_mission_demand=3000000.0,
               fundable_pct=83.5, unfunded_pct=16.5, notes="x")
    data = serialize(b)
    assert data["period"] == "Weekly"
    assert data["budget_ceiling"] == 2500000.0


# --------------------------------------------------------------------------- #
# mission state machine (happy path)
# --------------------------------------------------------------------------- #
def _reduce(events: list[str]) -> str:
    state = MissionStatus.NEW
    for event_type in events:
        state = STATE_TRANSITIONS.get((state, event_type), state)
    return state


def test_warehouse_summary_shape():
    w = Warehouse(
        id="W001", name="Hub Wrocław", city="Wrocław", voivodeship="Dolnośląskie",
        warehouse_type="Cold storage", cold_storage=True,
        available_capacity_pct=40, availability_status="Available",
    )
    summary = warehouses._summary(w)
    assert summary == {
        "id": "W001",
        "name": "Hub Wrocław",
        "city": "Wrocław",
        "voivodeship": "Dolnośląskie",
        "warehouse_type": "Cold storage",
        "cold_storage": True,
        "available_capacity_pct": 40,
        "availability_status": "Available",
    }


def test_mission_happy_path_state_machine():
    final = _reduce([
        EventType.COORDINATOR_FUND,
        EventType.ALLOCATION_ASSIGNED,
        EventType.DRIVER_EN_ROUTE,
        EventType.DRIVER_DELIVERED,
        EventType.SYSTEM_MISSION_ARRIVED,
    ])
    assert final == MissionStatus.CLOSED
