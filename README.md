# UkraineDayHackathon

Containerized project skeleton.

- **frontend/** — React + TypeScript (Vite)
- **backend/** — Python + FastAPI

## Run everything

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:8000 (docs at http://localhost:8000/docs)

## Layout

```
.
├── docker-compose.yml
├── backend/        # FastAPI app
└── frontend/       # React + TS app
```

Add more services as new entries under `services:` in `docker-compose.yml`.
