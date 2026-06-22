from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db, init_db
from app.models import Carrier, Vehicle, Warehouse, Mission, CrisisObject, Budget


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    init_db()
    yield


app = FastAPI(
    title="Crisis Logistics Grid API",
    description="Backend for crisis logistics coordination",
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Crisis Logistics Grid API"}


@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    """Health check with database connectivity test."""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "degraded", "database": str(e)}


@app.get("/api/stats")
def stats(db: Session = Depends(get_db)):
    """Get basic statistics about loaded data."""
    return {
        "carriers": db.query(Carrier).count(),
        "vehicles": db.query(Vehicle).count(),
        "warehouses": db.query(Warehouse).count(),
        "missions": db.query(Mission).count(),
        "crisis_objects": db.query(CrisisObject).count(),
        "budget_records": db.query(Budget).count(),
    }
