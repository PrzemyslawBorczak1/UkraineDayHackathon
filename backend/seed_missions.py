"""
Seed missions and tasks for the first 3 carriers (C001, C002, C003).
Run from project root with the venv active:
    cd backend && python seed_missions.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timezone, timedelta
from app.database import SessionLocal
from app.models.mission import Mission
from app.models.task import Task

db = SessionLocal()

NOW = datetime.now(timezone.utc)
D = lambda days: NOW + timedelta(days=days)

# WKT helpers (lon, lat)
def pt(lon, lat):
    return f"SRID=4326;POINT({lon} {lat})"

# (carrier_id, [vehicle_ids])
CARRIERS = [
    ("C001", ["V0001", "V0002", "V0589"]),
    ("C002", ["V0009", "V0010", "V0011"]),
    ("C003", ["V0016", "V0017", "V0018"]),
]

MISSIONS = [
    # C001 — 3 missions in different statuses
    dict(
        id="M9001",
        cargo_type="Food supplies",
        origin_point="Rzeszów", origin_geom=pt(22.005, 50.041),
        destination_point="Lviv", dest_geom=pt(24.029, 49.842),
        route_distance_km=180,
        weight_t=12.5, volume_m3=48.0,
        required_vehicle_type="Standard semi",
        priority="Critical",
        available_from=D(-2), deadline=D(1),
        estimated_cost=4200.0,
        status="IN_TRANSIT",
        requesting_authority="UNHCR Poland",
        special_requirement=None,
        certificate_adr=False, liftgate=False,
        assigned_carrier_id="C001", assigned_vehicle_id="V0001",
        assignment_score=87.5,
    ),
    dict(
        id="M9002",
        cargo_type="Medical equipment",
        origin_point="Kraków", origin_geom=pt(19.945, 50.065),
        destination_point="Kyiv", dest_geom=pt(30.523, 50.450),
        route_distance_km=820,
        weight_t=3.2, volume_m3=12.0,
        required_vehicle_type="Rigid truck",
        priority="Critical",
        available_from=D(0), deadline=D(3),
        estimated_cost=9800.0,
        status="ASSIGNED",
        requesting_authority="WHO Regional Office",
        special_requirement="Temperature-controlled transport required (2–8°C)",
        certificate_adr=False, liftgate=True,
        assigned_carrier_id="C001", assigned_vehicle_id="V0002",
        assignment_score=91.0,
    ),
    dict(
        id="M9003",
        cargo_type="Blankets and clothing",
        origin_point="Lublin", origin_geom=pt(22.566, 51.246),
        destination_point="Kharkiv", dest_geom=pt(36.292, 49.993),
        route_distance_km=950,
        weight_t=8.0, volume_m3=60.0,
        required_vehicle_type="Standard semi",
        priority="Normal",
        available_from=D(1), deadline=D(7),
        estimated_cost=7500.0,
        status="FUNDED",
        requesting_authority="ICRC",
        special_requirement=None,
        certificate_adr=False, liftgate=False,
        assigned_carrier_id="C001", assigned_vehicle_id=None,
        assignment_score=None,
    ),
    # C002 — 3 missions
    dict(
        id="M9004",
        cargo_type="Hazardous materials (ADR)",
        origin_point="Warszawa", origin_geom=pt(21.012, 52.229),
        destination_point="Odesa", dest_geom=pt(30.723, 46.483),
        route_distance_km=1100,
        weight_t=6.0, volume_m3=20.0,
        required_vehicle_type="Standard semi",
        priority="High",
        available_from=D(-1), deadline=D(2),
        estimated_cost=14000.0,
        status="IN_TRANSIT",
        requesting_authority="Polish Red Cross",
        special_requirement="ADR certificate required — class 6.2 biological substances",
        certificate_adr=True, liftgate=False,
        assigned_carrier_id="C002", assigned_vehicle_id="V0009",
        assignment_score=78.0,
    ),
    dict(
        id="M9005",
        cargo_type="Generators",
        origin_point="Gdańsk", origin_geom=pt(18.646, 54.352),
        destination_point="Zaporizhzhia", dest_geom=pt(35.175, 47.838),
        route_distance_km=1450,
        weight_t=18.0, volume_m3=55.0,
        required_vehicle_type="Standard semi",
        priority="High",
        available_from=D(0), deadline=D(5),
        estimated_cost=16500.0,
        status="ASSIGNED",
        requesting_authority="UNDP Ukraine",
        special_requirement="Liftgate required for unloading at destination",
        certificate_adr=False, liftgate=True,
        assigned_carrier_id="C002", assigned_vehicle_id="V0010",
        assignment_score=82.0,
    ),
    dict(
        id="M9006",
        cargo_type="Water purification units",
        origin_point="Wrocław", origin_geom=pt(17.038, 51.107),
        destination_point="Mykolaiv", dest_geom=pt(31.994, 46.975),
        route_distance_km=1250,
        weight_t=5.5, volume_m3=22.0,
        required_vehicle_type="Rigid truck",
        priority="Critical",
        available_from=D(2), deadline=D(6),
        estimated_cost=11000.0,
        status="QUEUED",
        requesting_authority="UNICEF",
        special_requirement=None,
        certificate_adr=False, liftgate=False,
        assigned_carrier_id="C002", assigned_vehicle_id=None,
        assignment_score=None,
    ),
    # C003 — 3 missions
    dict(
        id="M9007",
        cargo_type="Refrigerated pharmaceuticals",
        origin_point="Katowice", origin_geom=pt(19.024, 50.264),
        destination_point="Dnipro", dest_geom=pt(35.046, 48.464),
        route_distance_km=1000,
        weight_t=4.0, volume_m3=16.0,
        required_vehicle_type="Refrigerated semi",
        priority="Critical",
        available_from=D(-3), deadline=D(0),
        estimated_cost=12500.0,
        status="DELIVERED",
        requesting_authority="MSF Poland",
        special_requirement="Temperature-controlled (2–8°C) — COVID vaccines",
        certificate_adr=False, liftgate=False,
        assigned_carrier_id="C003", assigned_vehicle_id="V0016",
        assignment_score=95.0,
    ),
    dict(
        id="M9008",
        cargo_type="Shelter materials",
        origin_point="Poznań", origin_geom=pt(16.929, 52.407),
        destination_point="Sumy", dest_geom=pt(34.799, 50.907),
        route_distance_km=1150,
        weight_t=22.0, volume_m3=85.0,
        required_vehicle_type="Standard semi",
        priority="High",
        available_from=D(-1), deadline=D(3),
        estimated_cost=10200.0,
        status="IN_TRANSIT",
        requesting_authority="IOM Ukraine",
        special_requirement=None,
        certificate_adr=False, liftgate=False,
        assigned_carrier_id="C003", assigned_vehicle_id="V0017",
        assignment_score=88.0,
    ),
    dict(
        id="M9009",
        cargo_type="Baby food and diapers",
        origin_point="Łódź", origin_geom=pt(19.456, 51.759),
        destination_point="Chernihiv", dest_geom=pt(31.298, 51.494),
        route_distance_km=980,
        weight_t=7.5, volume_m3=35.0,
        required_vehicle_type="Rigid truck",
        priority="Normal",
        available_from=D(3), deadline=D(10),
        estimated_cost=8800.0,
        status="NEW",
        requesting_authority="UNHCR Ukraine",
        special_requirement=None,
        certificate_adr=False, liftgate=False,
        assigned_carrier_id="C003", assigned_vehicle_id=None,
        assignment_score=None,
    ),
]

# Tasks: link assigned missions to their vehicles
TASKS = [
    # M9001 — IN_TRANSIT, V0001 assigned
    {"mission_id": "M9001", "vehicle_id": "V0001"},
    # M9002 — ASSIGNED, V0002 assigned; second vehicle also helps
    {"mission_id": "M9002", "vehicle_id": "V0002"},
    {"mission_id": "M9002", "vehicle_id": "V0589"},
    # M9004 — IN_TRANSIT, V0009
    {"mission_id": "M9004", "vehicle_id": "V0009"},
    # M9005 — ASSIGNED, V0010 + V0011
    {"mission_id": "M9005", "vehicle_id": "V0010"},
    {"mission_id": "M9005", "vehicle_id": "V0011"},
    # M9007 — DELIVERED, V0016
    {"mission_id": "M9007", "vehicle_id": "V0016"},
    # M9008 — IN_TRANSIT, V0017 + V0018
    {"mission_id": "M9008", "vehicle_id": "V0017"},
    {"mission_id": "M9008", "vehicle_id": "V0018"},
]

try:
    # Remove existing seed missions to allow re-running
    seed_ids = [m["id"] for m in MISSIONS]
    db.query(Task).filter(Task.mission_id.in_(seed_ids)).delete(synchronize_session=False)
    db.query(Mission).filter(Mission.id.in_(seed_ids)).delete(synchronize_session=False)

    for m in MISSIONS:
        db.add(Mission(
            id=m["id"],
            cargo_type=m["cargo_type"],
            origin_point=m["origin_point"],
            origin_geom=m["origin_geom"],
            destination_point=m["destination_point"],
            dest_geom=m["dest_geom"],
            route_distance_km=m["route_distance_km"],
            weight_t=m["weight_t"],
            volume_m3=m["volume_m3"],
            required_vehicle_type=m["required_vehicle_type"],
            priority=m["priority"],
            available_from=m["available_from"],
            deadline=m["deadline"],
            estimated_cost=m["estimated_cost"],
            status=m["status"],
            requesting_authority=m["requesting_authority"],
            special_requirement=m["special_requirement"],
            certificate_adr=m["certificate_adr"],
            liftgate=m["liftgate"],
            assigned_carrier_id=m["assigned_carrier_id"],
            assigned_vehicle_id=m["assigned_vehicle_id"],
            assignment_score=m["assignment_score"],
        ))

    for t in TASKS:
        db.add(Task(mission_id=t["mission_id"], vehicle_id=t["vehicle_id"]))

    db.commit()
    print(f"Seeded {len(MISSIONS)} missions and {len(TASKS)} tasks.")
    for c_id, _ in CARRIERS:
        count = sum(1 for m in MISSIONS if m["assigned_carrier_id"] == c_id)
        print(f"  {c_id}: {count} missions")

except Exception as e:
    db.rollback()
    print(f"ERROR: {e}")
    raise
finally:
    db.close()
