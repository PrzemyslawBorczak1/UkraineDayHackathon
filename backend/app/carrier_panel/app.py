"""Standalone FastAPI app for the carrier panel.

Runs on its own port so it stays out of the way of the shared backend:

    cd backend
    DATABASE_URL=postgresql+psycopg://crisis:crisis@localhost:5432/crisis \
      uvicorn app.carrier_panel.app:app --port 8001 --reload
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.carrier_panel.router import router

app = FastAPI(
    title="Carrier Panel API",
    description="Self-service registration + verification for logistics operators",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


app.include_router(router)
