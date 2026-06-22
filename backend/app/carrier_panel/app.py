"""Standalone FastAPI app for the carrier panel.

Runs on its own port so it stays out of the way of the shared backend:

    cd backend
    uvicorn app.carrier_panel.app:app --port 8001 --reload

Needs no database — only the verification engine (pure stdlib) and the CSVs
for seeding. Point CARRIER_CSV_DIR at the dataset's csv/ folder if it isn't
found automatically.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.carrier_panel import store
from app.carrier_panel.router import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    store.seed()
    yield


app = FastAPI(
    title="Carrier Panel API",
    description="Self-service registration + verification for logistics operators",
    version="0.1.0",
    lifespan=lifespan,
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
    return {"status": "ok", "carriers_loaded": len(store.list_companies())}


app.include_router(router)
