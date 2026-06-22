"""
CSV data loader for Crisis Logistics Grid.

Loads data from CSV files into PostgreSQL/PostGIS database.
Run: python -m app.load
"""
import csv
import os
import re
from datetime import datetime, date
from pathlib import Path

from shapely.geometry import Point
from geoalchemy2.shape import from_shape

from app.database import engine, SessionLocal, init_db, Base
from app.models import (
    Carrier, Vehicle, Warehouse, Mission,
    PublicVerification, CrisisObject, Budget
)
from app.models.mission import MissionStatus

# Path to CSV directory (mounted as /data/csv in Docker, or local path)
CSV_DIR = Path(os.getenv("CSV_DIR", "/data/csv"))


def parse_bool(value: str) -> bool:
    return value.strip().lower() in ("yes", "true", "1")


def parse_date(value: str) -> date:
    return datetime.strptime(value.strip(), "%Y-%m-%d").date()


def parse_datetime(value: str) -> datetime:
    value = value.strip()
    # Handle ISO 8601 with timezone like "2026-07-11T05:00+02:00"
    if "+" in value or value.endswith("Z"):
        # Replace +HH:MM with +HHMM for fromisoformat compatibility
        if "+" in value and ":" in value.split("+")[1]:
            parts = value.rsplit("+", 1)
            tz = parts[1].replace(":", "")
            value = f"{parts[0]}+{tz}"
        return datetime.fromisoformat(value.replace("Z", "+0000"))
    return datetime.fromisoformat(value)


def parse_float(value: str) -> float:
    return float(value.strip().replace(",", ".")) if value.strip() else 0.0


def parse_int(value: str) -> int:
    return int(float(value.strip())) if value.strip() else 0


def make_point(lat: str, lng: str):
    """Create PostGIS point from lat/lng strings. Note: Point takes (lng, lat)."""
    return from_shape(Point(parse_float(lng), parse_float(lat)), srid=4326)


_TEMP_RE = re.compile(r"(-?\d+)\s*-\s*(-?\d+)\s*°?\s*C", re.IGNORECASE)


def parse_requirements(note: str):
    """
    Extract structured requirements from a mission's Special Requirement note.

    Returns (temperature_range, certificate_adr, liftgate):
      - temperature_range: [min_c, max_c] if a "X-Y°C" range is present, else None
      - certificate_adr:   True if note mentions ADR or hazmat, else False
      - liftgate:          True if note mentions a liftgate, else False
    """
    low = (note or "").lower()

    temp_range = None
    m = _TEMP_RE.search(note or "")
    if m and "temperature" in low:
        temp_range = [int(m.group(1)), int(m.group(2))]

    certificate_adr = "adr" in low or "hazmat" in low
    liftgate = "liftgate" in low

    return temp_range, certificate_adr, liftgate


def load_carriers(session, csv_path: Path):
    print(f"Loading carriers from {csv_path}...")
    with open(csv_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            carrier = Carrier(
                id=row["Carrier ID"],
                name=row["Carrier Name"],
                tax_id=row["Fictional Tax ID"],
                hq_city=row["Headquarters City"],
                voivodeship=row["Voivodeship"],
                hq_geom=make_point(row["Headquarters Latitude"], row["Headquarters Longitude"]),
                activity_type=row["Activity Type"],
                declared_fleet_size=parse_int(row["Declared Fleet Size"]),
                declared_warehouse_capacity_m2=parse_int(row["Declared Warehouse Capacity (m2)"]),
                crisis_participation_status=row["Crisis Participation Status"],
                documentation_status=row["Documentation Status"],
                insurance_expiry_date=parse_date(row["Insurance Expiry Date"]),
                transport_licence_expiry_date=parse_date(row["Transport Licence Expiry Date"]),
                declared_activation_time_hours=parse_int(row["Declared Activation Time (Hours)"]),
                reliability_score=parse_int(row["Reliability Score (0-100)"]),
                risk_rating=row["Risk Rating"],
                cost_per_km=parse_float(row["Cost per km (PLN)"]),
                preferred_contact_channel=row["Preferred Contact Channel"],
                operating_region=row["Operating Region"],
            )
            session.add(carrier)
    session.commit()
    print(f"  Loaded {session.query(Carrier).count()} carriers")


def load_vehicles(session, csv_path: Path):
    print(f"Loading vehicles from {csv_path}...")
    with open(csv_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            vehicle = Vehicle(
                id=row["Vehicle ID"],
                carrier_id=row["Carrier ID"],
                vehicle_type=row["Vehicle Type"],
                gvw_t=parse_float(row["Gross Vehicle Weight (t)"]),
                payload_t=parse_float(row["Payload (t)"]),
                volume_m3=parse_int(row["Volume (m3)"]),
                temperature_controlled=parse_bool(row["Temperature Controlled"]),
                adr_enabled=parse_bool(row["ADR Enabled"]),
                liftgate=parse_bool(row["Liftgate"]),
                current_city=row["Current City"],
                current_geom=make_point(row["Current Latitude"], row["Current Longitude"]),
                availability_status=row["Availability Status"],
                activation_time_hours=parse_int(row["Activation Time (Hours)"]),
                operational_range_km=parse_int(row["Operational Range (km)"]),
                restriction_note=row.get("Restriction Note", "").strip() or None,
            )
            session.add(vehicle)
    session.commit()
    print(f"  Loaded {session.query(Vehicle).count()} vehicles")


def load_warehouses(session, csv_path: Path):
    print(f"Loading warehouses from {csv_path}...")
    with open(csv_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            warehouse = Warehouse(
                id=row["Warehouse ID"],
                carrier_id=row["Carrier ID"],
                name=row["Warehouse Name"],
                city=row["City"],
                voivodeship=row["Voivodeship"],
                geom=make_point(row["Latitude"], row["Longitude"]),
                warehouse_type=row["Warehouse Type"],
                area_m2=parse_int(row["Area (m2)"]),
                dock_doors=parse_int(row["Dock Doors"]),
                cold_storage=parse_bool(row["Cold Storage"]),
                on_site_security=parse_bool(row["On-site Security"]),
                operating_hours=row["Operating Hours"],
                available_capacity_pct=parse_int(row["Available Capacity (%)"]),
                availability_status=row["Availability Status"],
                activation_time_hours=parse_int(row["Activation Time (Hours)"]),
            )
            session.add(warehouse)
    session.commit()
    print(f"  Loaded {session.query(Warehouse).count()} warehouses")


def load_missions(session, csv_path: Path):
    print(f"Loading missions from {csv_path}...")
    with open(csv_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            special_requirement = row.get("Special Requirement", "").strip() or None
            temp_range, certificate_adr, liftgate = parse_requirements(special_requirement)
            mission = Mission(
                id=row["Mission ID"],
                cargo_type=row["Cargo Type"],
                origin_point=row["Origin Point"],
                origin_geom=make_point(row["Origin Latitude"], row["Origin Longitude"]),
                destination_point=row["Destination Point"],
                dest_geom=make_point(row["Destination Latitude"], row["Destination Longitude"]),
                route_distance_km=parse_int(row["Route Distance (km)"]),
                weight_t=parse_float(row["Weight (Tonnes)"]),
                volume_m3=parse_float(row["Volume (m3)"]),
                required_vehicle_type=row["Required Vehicle Type"],
                priority=row["Priority"],
                available_from=parse_datetime(row["available_from"]),
                deadline=parse_datetime(row["deadline"]),
                estimated_cost=parse_float(row["Estimated Cost (PLN)"]),
                # CSV status is always "Pending" at generation time; normalise to
                # the canonical initial state so Mission.status (cache) matches
                # replay_mission_state(), which seeds from NEW.
                status=MissionStatus.NEW,
                requesting_authority=row["Requesting Authority"],
                special_requirement=special_requirement,
                required_temperature=temp_range,
                certificate_adr=certificate_adr,
                liftgate=liftgate,
            )
            session.add(mission)
    session.commit()
    print(f"  Loaded {session.query(Mission).count()} missions")


def load_public_verification(session, csv_path: Path):
    print(f"Loading public verification from {csv_path}...")
    with open(csv_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            verification = PublicVerification(
                carrier_id=row["Carrier ID"],
                company_registry_status=row["Company Registry Status"],
                transport_licence_status=row["Transport Licence Status"],
                insurance_status=row["Insurance Status"],
                tax_arrears=row["Fictional Tax Arrears"],
                sanctions_screening_result=row["Sanctions Screening Result"],
                registry_match_quality=row["Registry Match Quality"],
                incidents_24m=parse_int(row["Incidents in Last 24 Months"]),
                documentation_completeness_pct=parse_int(row["Documentation Completeness (%)"]),
                public_verification_score=parse_int(row["Public Verification Score (0-100)"]),
                verification_result=row["Verification Result"],
                verification_notes=row.get("Verification Notes", "").strip() or None,
            )
            session.add(verification)
    session.commit()
    print(f"  Loaded {session.query(PublicVerification).count()} verification records")


def load_crisis_map(session, csv_path: Path):
    print(f"Loading crisis map from {csv_path}...")
    with open(csv_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            update_time = row.get("Estimated Update Time", "").strip()
            crisis_obj = CrisisObject(
                id=row["Map Object ID"],
                object_type=row["Object Type"],
                name=row["Name"],
                city=row["City"],
                voivodeship=row["Voivodeship"],
                geom=make_point(row["Latitude"], row["Longitude"]),
                severity=row["Severity"],
                status=row["Status"],
                estimated_update_time=parse_datetime(update_time) if update_time else None,
                operational_note=row.get("Operational Note", "").strip() or None,
            )
            session.add(crisis_obj)
    session.commit()
    print(f"  Loaded {session.query(CrisisObject).count()} crisis objects")


def load_budget(session, csv_path: Path):
    print(f"Loading budget from {csv_path}...")
    with open(csv_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            budget = Budget(
                period=row["Period"],
                budget_ceiling=parse_float(row["Budget Ceiling (PLN)"]),
                estimated_mission_demand=parse_float(row["Estimated Mission Demand (PLN)"]),
                fundable_pct=parse_float(row["Fundable (%)"]),
                unfunded_pct=parse_float(row["Unfunded (%)"]),
                notes=row.get("Notes", "").strip() or None,
            )
            session.add(budget)
    session.commit()
    print(f"  Loaded {session.query(Budget).count()} budget records")


def load_all():
    """Initialize database and load all CSV data."""
    print("Initializing database...")
    init_db()

    session = SessionLocal()
    try:
        # Clear existing data (for idempotent reloads)
        print("Clearing existing data...")
        session.query(Budget).delete()
        session.query(CrisisObject).delete()
        session.query(PublicVerification).delete()
        session.query(Mission).delete()
        session.query(Warehouse).delete()
        session.query(Vehicle).delete()
        session.query(Carrier).delete()
        session.commit()

        # Load in order (respecting foreign keys)
        load_carriers(session, CSV_DIR / "carriers.csv")
        load_vehicles(session, CSV_DIR / "vehicles.csv")
        load_warehouses(session, CSV_DIR / "warehouses.csv")
        load_missions(session, CSV_DIR / "missions.csv")
        load_public_verification(session, CSV_DIR / "public_verification.csv")
        load_crisis_map(session, CSV_DIR / "crisis_map.csv")
        load_budget(session, CSV_DIR / "budget.csv")

        print("\nData load complete!")

    finally:
        session.close()


if __name__ == "__main__":
    load_all()
