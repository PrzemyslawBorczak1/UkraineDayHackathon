# Backend - Crisis Logistics Grid

## Stack
- Python 3.11+ / FastAPI
- SQLAlchemy 2.0 + GeoAlchemy2
- PostgreSQL 16 + PostGIS 3.4
- psycopg 3

## Struktura

```
backend/app/
├── database.py          # połączenie DB, Base, init_db()
├── load.py              # import CSV -> DB (python -m app.load)
├── main.py              # FastAPI app + include_router
├── serialize.py         # ORM -> dict (geom -> {lat,lng}, daty -> ISO)
├── engine_adapter.py    # interwały silnika -> Task (mapowanie faz)
├── allocation/
│   ├── engine.py        # wendorowany silnik ALNS (z engine/main.py)
│   └── pipeline.py      # DB -> dataclassy silnika -> scheduler -> Task
├── models/
│   ├── carrier.py       # Carrier (C001-C050)
│   ├── vehicle.py       # Vehicle (V0001+)
│   ├── warehouse.py     # Warehouse (W001-W024)
│   ├── mission.py       # Mission (M0001-M4000) + MissionStatus
│   ├── task.py          # Task (część misji przypisana do pojazdu)
│   ├── public_verification.py  # 1:1 z Carrier + VerificationResult
│   ├── crisis_object.py # CrisisObject (CM001-CM055)
│   └── budget.py        # Budget
├── routers/
│   ├── driver.py        # flow kierowcy (auth/tasks/incident/vehicle) — /api/v1
│   ├── missions.py      # tworzenie misji — /api/v1
│   ├── warehouses.py    # lista + szczegóły magazynów — /warehouse
│   ├── crisis.py        # lista + szczegóły obiektów crisis-map — /crisis
│   └── allocation.py    # uruchomienie alokacji — /api/v1
├── events/
│   ├── types.py         # EventType (driver/carrier/coordinator/system)
│   ├── mission_event.py # MissionEvent (append-only log)
│   ├── transitions.py   # STATE_TRANSITIONS mapa
│   └── handlers.py      # emit_event(), get_mission_history(), replay_mission_state()
└── tests/              # happy-path unit testy (pytest, bez DB)
```

**Task** = granularna jednostka pracy: (część) misji przypisana do jednego
pojazdu. Misje są podzielne — jedną misję można rozbić na kilka tasków/pojazdów.
MVP trzyma same linki (`id`, `vehicle_id`, `mission_id`); metadane taska
(cargo_type, volume, weight, czas start/koniec) dojdą później.

## Uruchomienie

```bash
docker-compose up -d db          # PostGIS
docker-compose up backend        # FastAPI na :8000

# Załaduj dane z CSV
docker exec backend python -m app.load
```

## Event Sourcing

Mission.status to cache. Źródło prawdy = tabela `mission_events`.

**Stany misji:** `NEW → ACCEPTED → IN_PROGRESS → DONE`
- `NEW` — utworzona, czeka na akceptację carriera magazynu źródłowego
- `ACCEPTED` — carrier udostępnił magazyn źródłowy (akceptacja = „udostępniam
  warehouse", NIE „wysyłam pojazd")
- `IN_PROGRESS` — wykonanie ruszyło (alokacja / kierowca w drodze)
- `DONE` — dostarczona

Tranzycje (`transitions.py`): `NEW +carrier_accept → ACCEPTED`,
`ACCEPTED +allocation_assigned|driver_en_route → IN_PROGRESS`,
`IN_PROGRESS +driver_delivered → DONE`.

**Stany taska** (faza wykonania, kolumna `Task.status` + `start_date`/`end_date`):
`Traveling` (dojazd pusty), `Transporting` (jazda z ładunkiem),
`PrepareUnload`, `Unload`, `Wait`.

CSV ma `Mission Status = Pending` w chwili generacji; loader normalizuje to do
kanonicznego `NEW` (zgodne z seedem `replay_mission_state()`).

## Endpointy

System:
- `GET /` - info
- `GET /api/health` - health check + DB
- `GET /api/stats` - liczniki encji

Flow kierowcy — pełny kontrakt w [`../API_SCHEME.md`](../API_SCHEME.md) (MVP, happy path):
- `POST /api/v1/auth/login` - logowanie po `vehicle_id` (bez JWT) → `{success, vehicle_id}`
- `GET /api/v1/vehicles/{vehicleId}` - szczegóły pojazdu (features/restrictions)
- `GET /api/v1/vehicles/{vehicleId}/tasks` - taski pojazdu (z origin/dest coords + adresami)
- `POST /api/v1/tasks/{taskId}/incidents` - incydent `delay`/`endMission`
- `PATCH /api/v1/tasks/{taskId}` - zakończenie taska → `driver_delivered`

Koordynator:
- `POST /api/v1/missions` - tworzenie misji (status NEW, auto-id; origin z `origin_warehouse_id`
  — point/geom/address z magazynu; parsuje temp/ADR/liftgate z noty)
- `GET /warehouse/` - lista magazynów (pola summary/filtrowania)
- `GET /warehouse/{warehouseId}/` - pełny model magazynu
- `GET /crisis/` - lista obiektów crisis-map (summary + lat/lng)
- `GET /crisis/{objectId}/` - pełny model obiektu crisis-map
- `POST /api/v1/allocate?day=YYYY-MM-DD&iterations=2` - uruchamia alokację na dany
  dzień, zapisuje harmonogram jako Taski (idempotentnie), zwraca summary

### Potok alokacji (`allocation/pipeline.py`)

`run_allocation(db, day, iterations)`: DB → dataclassy silnika → `DailyALNSScheduler`
→ `engine_adapter.persist_schedule` → wiersze `tasks`. Silnik karmiony w tonach/m³
(matematyka jest ratiowa, brak konwersji kg). Twardy filtr: pojazdy carrierów
`Do not use` są wykluczane. Origin/destination misji → syntetyczne magazyny 24/7
(do czasu wpięcia realnych). Daty konwertowane na naive UTC (silnik zakłada naive).

> Endpointy taskowe niejawnie aktualizują stan misji przez event log
> (`task.mission_id` → `emit_event`). MVP: dostarczenie jednego taska emituje
> `driver_delivered` całej misji; docelowo misja → DELIVERED dopiero gdy
> wszystkie jej taski są gotowe.
>
> Błędy (poza `auth/login`) mają jednolity kształt `{error, message, status_code}`.

## Testy

```bash
python -m pytest tests/ -q   # happy-path unit testy, bez DB (sqlite fallback)
```

## TODO

- [ ] Endpoint akceptacji misji przez carriera (NEW → ACCEPTED) + origin jako warehouse
- [ ] Misja → DONE dopiero po ukończeniu wszystkich tasków
- [ ] Metadane taska (cargo_type, volume, weight)
- [ ] Endpoint pobierania tras (`route_geom`) + integracja Geoapify
- [ ] Silnik alokacji (greedy scoring) generujący taski
- [ ] API CRUD dla pozostałych encji + endpointy przewoźnika
- [ ] WebSocket/SSE dla real-time
