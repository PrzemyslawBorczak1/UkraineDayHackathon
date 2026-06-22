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
├── main.py              # FastAPI app
├── models/
│   ├── carrier.py       # Carrier (C001-C050)
│   ├── vehicle.py       # Vehicle (V0001+)
│   ├── warehouse.py     # Warehouse (W001-W024)
│   ├── mission.py       # Mission (M0001-M4000) + MissionStatus
│   ├── public_verification.py  # 1:1 z Carrier + VerificationResult
│   ├── crisis_object.py # CrisisObject (CM001-CM055)
│   └── budget.py        # Budget
└── events/
    ├── types.py         # EventType (driver/carrier/coordinator/system)
    ├── mission_event.py # MissionEvent (append-only log)
    ├── transitions.py   # STATE_TRANSITIONS mapa
    └── handlers.py      # emit_event(), get_mission_history(), replay_mission_state()
```

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

- `GET /` - info
- `GET /api/health` - health check + DB
- `GET /api/stats` - liczniki encji

## TODO

- [ ] Silnik alokacji (greedy scoring)
- [ ] API CRUD dla encji
- [ ] WebSocket/SSE dla real-time
