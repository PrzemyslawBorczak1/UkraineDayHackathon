"""Recommendations endpoint (coordinator side).

Gathers warehouses + crisis-map demand points from the DB, shapes them into the
payload the LLM recommendations service expects (CSV-aliased field names), calls
that service and returns its suggested missions. The service itself lives in
`recomendations/` and runs as a separate container.
"""
import os

import httpx
from fastapi import APIRouter, Depends, HTTPException
from geoalchemy2.shape import to_shape
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Warehouse, CrisisObject

router = APIRouter(prefix="/api/v1", tags=["recommendations"])

RECOMMENDATIONS_URL = os.getenv("RECOMMENDATIONS_URL", "http://recommendations:8001")

# Crisis-map objects that are NOT delivery destinations.
_NON_DEMAND_TYPES = {"Closed road", "Risk zone"}


def _warehouse_payload(w: Warehouse) -> dict:
    p = to_shape(w.geom)
    return {
        "Warehouse ID": w.id,
        "Warehouse Name": w.name,
        "City": w.city,
        "Latitude": p.y,
        "Longitude": p.x,
        "Warehouse Type": w.warehouse_type,
        "Cold Storage": "Yes" if w.cold_storage else "No",
        "Availability Status": w.availability_status,
        "Available Capacity (%)": w.available_capacity_pct,
    }


def _crisis_payload(o: CrisisObject) -> dict:
    p = to_shape(o.geom)
    return {
        "Map Object ID": o.id,
        "Name": o.name,
        "City": o.city,
        "Latitude": p.y,
        "Longitude": p.x,
        "Object Type": o.object_type,
        "Severity": o.severity,
        "Status": o.status,
        "Operational Note": o.operational_note or "",
    }


@router.post("/recommendations")
async def recommend_missions(db: Session = Depends(get_db)):
    """Ask the LLM service to recommend missions from current warehouses + demand."""
    warehouses = db.query(Warehouse).all()
    demand = [
        o for o in db.query(CrisisObject).all()
        if o.object_type not in _NON_DEMAND_TYPES
    ]
    if not warehouses or not demand:
        raise HTTPException(status_code=400, detail="No warehouses or demand points available")

    payload = {
        "magazyny": [_warehouse_payload(w) for w in warehouses],
        "punkty_odbioru": [_crisis_payload(o) for o in demand],
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(f"{RECOMMENDATIONS_URL}/rekomenduj-misje", json=payload)
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Recommendations service unreachable: {exc}")

    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"Recommendations service error: {resp.text}")
    return resp.json()
