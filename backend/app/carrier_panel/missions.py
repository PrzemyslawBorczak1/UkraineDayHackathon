"""Seed missions for the carrier panel demo (read-only, assigned by coordinators)."""
from app.carrier_panel.schemas import Mission

# Today = 2026-06-22.
# Active:    start <= today, end >= today
# Upcoming:  start > today
# Completed: end < today

_SEED: list[Mission] = [
    # ── C001 ──────────────────────────────────────────────────────────────
    Mission(id="M001", carrier_id="C001", title="Flood Relief Convoy — Wrocław to Opole",
            status="Active", priority="Critical", cargo_type="Emergency supplies",
            origin_city="Wrocław", destination_city="Opole",
            assigned_vehicle_ids=["V001", "V002"],
            start_date="2026-06-20", end_date="2026-06-24",
            coordinator="EOC Wrocław", distance_km=78,
            notes="Flood zone — military convoy escort arranged"),
    Mission(id="M002", carrier_id="C001", title="Medical Equipment — Katowice Distribution Hub",
            status="Upcoming", priority="High", cargo_type="Medical equipment",
            origin_city="Wrocław", destination_city="Katowice",
            assigned_vehicle_ids=["V003"], assigned_warehouse_id="W001",
            start_date="2026-06-26", end_date="2026-06-27",
            coordinator="EOC Katowice", distance_km=115, notes=None),
    Mission(id="M003", carrier_id="C001", title="Blanket & Clothing Distribution — Wałbrzych",
            status="Completed", priority="Normal", cargo_type="Humanitarian aid packages",
            origin_city="Wrocław", destination_city="Wałbrzych",
            assigned_vehicle_ids=["V004"],
            start_date="2026-06-15", end_date="2026-06-16",
            coordinator="Red Cross Poland", distance_km=72, notes=None),

    # ── C002 ──────────────────────────────────────────────────────────────
    Mission(id="M004", carrier_id="C002", title="Evacuation Support — Gdańsk Coastal Corridor",
            status="Active", priority="Critical", cargo_type="Evacuation support",
            origin_city="Gdańsk", destination_city="Bydgoszcz",
            assigned_vehicle_ids=["V010", "V011"],
            start_date="2026-06-21", end_date="2026-06-23",
            coordinator="EOC Gdańsk", distance_km=162, notes="Priority road clearance confirmed"),
    Mission(id="M005", carrier_id="C002", title="Food Package Distribution — Trójmiejskie Shelters",
            status="Upcoming", priority="High", cargo_type="Food packages",
            origin_city="Gdynia", destination_city="Gdańsk",
            assigned_vehicle_ids=["V012"],
            start_date="2026-06-25", end_date="2026-06-25",
            coordinator="PAH", distance_km=22, notes=None),

    # ── C003 ──────────────────────────────────────────────────────────────
    Mission(id="M006", carrier_id="C003", title="Water Purification Units — Rzeszów Forward Base",
            status="Active", priority="Critical", cargo_type="Water purification units",
            origin_city="Kraków", destination_city="Rzeszów",
            assigned_vehicle_ids=["V020"],
            start_date="2026-06-19", end_date="2026-06-22",
            coordinator="PCPM", distance_km=155,
            notes="ADR class 3 — driver certification verified"),

    # ── C004 ──────────────────────────────────────────────────────────────
    Mission(id="M007", carrier_id="C004", title="Heating Equipment Pre-positioning — Lublin Hub",
            status="Upcoming", priority="High", cargo_type="Heating equipment",
            origin_city="Warsaw", destination_city="Lublin",
            assigned_vehicle_ids=["V030"],
            start_date="2026-06-24", end_date="2026-06-24",
            coordinator="EOC Warsaw", distance_km=170, notes=None),
    Mission(id="M008", carrier_id="C004", title="Emergency Shelter Materials — Łódź",
            status="Completed", priority="Normal", cargo_type="Shelter materials",
            origin_city="Warsaw", destination_city="Łódź",
            assigned_vehicle_ids=["V031"],
            start_date="2026-06-10", end_date="2026-06-11",
            coordinator="UNHCR Poland", distance_km=135, notes=None),

    # ── C005 ──────────────────────────────────────────────────────────────
    Mission(id="M009", carrier_id="C005", title="Children's Aid Packages — Kraków Reception Points",
            status="Active", priority="High", cargo_type="Children's aid packages",
            origin_city="Katowice", destination_city="Kraków",
            assigned_vehicle_ids=["V040"],
            start_date="2026-06-22", end_date="2026-06-23",
            coordinator="UNICEF Poland", distance_km=80, notes=None),

    # ── C006 ──────────────────────────────────────────────────────────────
    Mission(id="M010", carrier_id="C006", title="Technical Equipment — Białystok EOC Support",
            status="Upcoming", priority="Normal", cargo_type="Technical equipment",
            origin_city="Warsaw", destination_city="Białystok",
            assigned_vehicle_ids=["V050"],
            start_date="2026-06-28", end_date="2026-06-29",
            coordinator="EOC Warsaw", distance_km=200, notes=None),

    # ── C007 ──────────────────────────────────────────────────────────────
    Mission(id="M011", carrier_id="C007", title="Food Aid — Poznań Humanitarian Hub",
            status="Completed", priority="High", cargo_type="Food packages",
            origin_city="Bydgoszcz", destination_city="Poznań",
            assigned_vehicle_ids=["V060"],
            start_date="2026-06-08", end_date="2026-06-09",
            coordinator="PAH", distance_km=100, notes=None),
    Mission(id="M012", carrier_id="C007", title="Medical Supplies — Toruń Field Hospital",
            status="Completed", priority="Critical", cargo_type="Medical equipment",
            origin_city="Bydgoszcz", destination_city="Toruń",
            assigned_vehicle_ids=["V061"],
            start_date="2026-06-05", end_date="2026-06-05",
            coordinator="Red Cross Poland", distance_km=45,
            notes="Refrigerated transport — 2–8°C maintained"),

    # ── C008 ──────────────────────────────────────────────────────────────
    Mission(id="M013", carrier_id="C008", title="Evacuation Supplies — Szczecin Port Area",
            status="Active", priority="High", cargo_type="Emergency supplies",
            origin_city="Szczecin", destination_city="Koszalin",
            assigned_vehicle_ids=["V070"],
            start_date="2026-06-21", end_date="2026-06-23",
            coordinator="EOC Szczecin", distance_km=135, notes=None),
    Mission(id="M014", carrier_id="C008", title="Humanitarian Aid — Gorzów Wielkopolski",
            status="Upcoming", priority="Normal", cargo_type="Humanitarian aid packages",
            origin_city="Szczecin", destination_city="Gorzów Wielkopolski",
            assigned_vehicle_ids=["V071"],
            start_date="2026-06-27", end_date="2026-06-27",
            coordinator="UNHCR Poland", distance_km=127, notes=None),

    # ── C009 ──────────────────────────────────────────────────────────────
    Mission(id="M015", carrier_id="C009", title="Winter Aid Pre-positioning — Kielce Region",
            status="Upcoming", priority="High", cargo_type="Heating equipment",
            origin_city="Łódź", destination_city="Kielce",
            assigned_vehicle_ids=["V080"],
            start_date="2026-06-30", end_date="2026-07-01",
            coordinator="EOC Łódź", distance_km=118, notes=None),

    # ── C010 ──────────────────────────────────────────────────────────────
    Mission(id="M016", carrier_id="C010", title="Refugee Reception — Rzeszów Airport Logistics",
            status="Active", priority="Critical", cargo_type="Humanitarian aid packages",
            origin_city="Rzeszów", destination_city="Przemyśl",
            assigned_vehicle_ids=["V090", "V091"],
            start_date="2026-06-20", end_date="2026-06-25",
            coordinator="UNHCR Poland", distance_km=77,
            notes="Cross-border coordination with UA side"),

    # ── C011 ──────────────────────────────────────────────────────────────
    Mission(id="M017", carrier_id="C011", title="Food Supplies — Lublin Distribution",
            status="Active", priority="High", cargo_type="Food packages",
            origin_city="Lublin", destination_city="Zamość",
            assigned_vehicle_ids=["V100"],
            start_date="2026-06-22", end_date="2026-06-22",
            coordinator="PAH", distance_km=93, notes=None),

    # ── C012 ──────────────────────────────────────────────────────────────
    Mission(id="M018", carrier_id="C012", title="Medical Cold Chain — Olsztyn Hospital Network",
            status="Upcoming", priority="High", cargo_type="Medical equipment",
            origin_city="Bydgoszcz", destination_city="Olsztyn",
            assigned_vehicle_ids=["V110"],
            start_date="2026-06-24", end_date="2026-06-25",
            coordinator="Red Cross Poland", distance_km=170,
            notes="Temperature log required — 2–8°C"),

    # ── C013 ──────────────────────────────────────────────────────────────
    Mission(id="M019", carrier_id="C013", title="Shelter Kit Distribution — Podkarpacie Region",
            status="Completed", priority="Critical", cargo_type="Shelter materials",
            origin_city="Rzeszów", destination_city="Sanok",
            assigned_vehicle_ids=["V120"],
            start_date="2026-06-12", end_date="2026-06-13",
            coordinator="PCPM", distance_km=58, notes=None),

    # ── C014 ──────────────────────────────────────────────────────────────
    Mission(id="M020", carrier_id="C014", title="Power Generator Transport — Radom EOC",
            status="Active", priority="High", cargo_type="Technical equipment",
            origin_city="Warsaw", destination_city="Radom",
            assigned_vehicle_ids=["V130"],
            start_date="2026-06-21", end_date="2026-06-22",
            coordinator="EOC Warsaw", distance_km=100, notes="Oversize load — escort arranged"),
    Mission(id="M021", carrier_id="C014", title="Food Aid — Łódź Reception Centre",
            status="Upcoming", priority="Normal", cargo_type="Food packages",
            origin_city="Warsaw", destination_city="Łódź",
            assigned_vehicle_ids=["V131"],
            start_date="2026-06-26", end_date="2026-06-26",
            coordinator="PAH", distance_km=135, notes=None),

    # ── C015 ──────────────────────────────────────────────────────────────
    Mission(id="M022", carrier_id="C015", title="Evacuation Aid — Opole Staging Area",
            status="Upcoming", priority="Critical", cargo_type="Emergency supplies",
            origin_city="Wrocław", destination_city="Opole",
            assigned_vehicle_ids=["V140", "V141"],
            start_date="2026-06-23", end_date="2026-06-24",
            coordinator="EOC Wrocław", distance_km=78, notes=None),
]

# Index by carrier_id
_BY_CARRIER: dict[str, list[Mission]] = {}
for _m in _SEED:
    _BY_CARRIER.setdefault(_m.carrier_id, []).append(_m)


def get_missions(carrier_id: str) -> list[Mission]:
    return _BY_CARRIER.get(carrier_id, [])
