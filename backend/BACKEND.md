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
│   └── driver.py        # endpointy flow kierowcy (tasks/incident/vehicle)
└── events/
    ├── types.py         # EventType (driver/carrier/coordinator/system)
    ├── mission_event.py # MissionEvent (append-only log)
    ├── transitions.py   # STATE_TRANSITIONS mapa
    └── handlers.py      # emit_event(), get_mission_history(), replay_mission_state()
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

Stany misji:
- NEW → FUNDED → ASSIGNED → IN_TRANSIT → DELIVERED → CLOSED
- Wyjątki: DEFERRED (brak budżetu), QUEUED (brak zasobu), INCIDENT, REASSIGN

CSV ma `Mission Status = Pending` w chwili generacji. Loader normalizuje to do
kanonicznego `NEW`, żeby cache (`Mission.status`) zgadzał się z `replay_mission_state()`,
który seeduje od `NEW`. Stała `MissionStatus.PENDING` i jej tranzycje zostają jako defensywa.

## Endpointy

System:
- `GET /` - info
- `GET /api/health` - health check + DB
- `GET /api/stats` - liczniki encji

Flow kierowcy (MVP, happy path — bez body, dokładna logika później):
- `GET /tasks/{vehicleId}` - taski przypisane do pojazdu (lista)
- `GET /vehicle/{vehicleId}` - model pojazdu (404 gdy brak)
- `POST /incident/{taskId}` - zgłasza incydent → emituje `driver_report_fault`
  na misji taska (niejawnie przesuwa stan misji)
- `PATCH /tasks/{taskId}` - oznacza task jako wykonany → emituje `driver_delivered`
  na misji taska

> Endpointy taskowe niejawnie aktualizują stan misji przez event log
> (`task.mission_id` → `emit_event`). MVP: dostarczenie jednego taska emituje
> `driver_delivered` całej misji; docelowo misja → DELIVERED dopiero gdy
> wszystkie jej taski są gotowe.

## TODO

- [ ] Misja → DELIVERED dopiero po ukończeniu wszystkich tasków
- [ ] Metadane taska (cargo_type, volume, weight, czas start/koniec)
- [ ] Silnik alokacji (greedy scoring) generujący taski
- [ ] API CRUD dla encji + endpointy koordynatora/przewoźnika
- [ ] WebSocket/SSE dla real-time
