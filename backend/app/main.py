from contextlib import asynccontextmanager
from http import HTTPStatus

from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db, init_db
from app.models import Carrier, Vehicle, Warehouse, Mission, CrisisObject, Budget
from app.routers import driver, missions, warehouses, allocation, crisis


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

app.include_router(driver.router)
app.include_router(missions.router)
app.include_router(warehouses.router)
app.include_router(allocation.router)
app.include_router(crisis.router)


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Uniform error shape: {error, message, status_code}."""
    try:
        phrase = HTTPStatus(exc.status_code).phrase
    except ValueError:
        phrase = "Error"
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": phrase, "message": exc.detail, "status_code": exc.status_code},
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
