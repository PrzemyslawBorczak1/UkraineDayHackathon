"""Warehouse endpoints (coordinator side).

List returns only fields useful for filtering/summary (city, region, fill,
name, ...); the full model is returned by the by-id endpoint.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Warehouse
from app.serialize import serialize

router = APIRouter(prefix="/warehouse", tags=["warehouses"])


def _summary(w: Warehouse) -> dict:
    """Lean shape for list/filter views."""
    return {
        "id": w.id,
        "name": w.name,
        "city": w.city,
        "voivodeship": w.voivodeship,
        "warehouse_type": w.warehouse_type,
        "cold_storage": w.cold_storage,
        "available_capacity_pct": w.available_capacity_pct,
        "availability_status": w.availability_status,
    }


@router.get("/")
def list_warehouses(db: Session = Depends(get_db)):
    """List warehouses (summary fields only)."""
    return [_summary(w) for w in db.query(Warehouse).all()]


@router.get("/{warehouse_id}/")
def get_warehouse(warehouse_id: str, db: Session = Depends(get_db)):
    """Full details for a single warehouse."""
    w = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if w is None:
        raise HTTPException(status_code=404, detail=f"Warehouse {warehouse_id} does not exist")
    return serialize(w)
