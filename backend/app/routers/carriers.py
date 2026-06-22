"""Carrier endpoints (coordinator side).

List returns only fields useful for filtering/summary (name, region, fleet,
reliability, ...); the full model is returned by the by-id endpoint.
"""
from fastapi import APIRouter, Depends, HTTPException
from geoalchemy2.shape import to_shape
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Carrier
from app.serialize import serialize

router = APIRouter(prefix="/carrier", tags=["carriers"])


def _summary(c: Carrier) -> dict:
    """Lean shape for list/filter/map views."""
    point = to_shape(c.hq_geom)
    return {
        "id": c.id,
        "name": c.name,
        "hq_city": c.hq_city,
        "voivodeship": c.voivodeship,
        "operating_region": c.operating_region,
        "activity_type": c.activity_type,
        "declared_fleet_size": c.declared_fleet_size,
        "reliability_score": c.reliability_score,
        "risk_rating": c.risk_rating,
        "crisis_participation_status": c.crisis_participation_status,
        "lat": point.y,
        "lng": point.x,
    }


@router.get("/")
def list_carriers(db: Session = Depends(get_db)):
    """List carriers (summary fields only)."""
    return [_summary(c) for c in db.query(Carrier).all()]


@router.get("/{carrier_id}/")
def get_carrier(carrier_id: str, db: Session = Depends(get_db)):
    """Full details for a single carrier."""
    c = db.query(Carrier).filter(Carrier.id == carrier_id).first()
    if c is None:
        raise HTTPException(status_code=404, detail=f"Carrier {carrier_id} does not exist")
    return serialize(c)
