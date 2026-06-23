"""Crisis-map endpoints (coordinator side).

List returns the fields the map needs (type, severity, status, coords); the full
record is returned by the by-id endpoint.
"""
from fastapi import APIRouter, Depends, HTTPException
from geoalchemy2.shape import to_shape
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CrisisObject
from app.serialize import serialize

router = APIRouter(prefix="/crisis", tags=["crisis"])


def _summary(c: CrisisObject) -> dict:
    """Lean shape for list/filter/map views."""
    point = to_shape(c.geom)
    return {
        "id": c.id,
        "object_type": c.object_type,
        "name": c.name,
        "city": c.city,
        "voivodeship": c.voivodeship,
        "severity": c.severity,
        "status": c.status,
        "lat": point.y,
        "lng": point.x,
    }


@router.get("/")
def list_crisis(db: Session = Depends(get_db)):
    """List crisis-map objects (summary fields only)."""
    return [_summary(c) for c in db.query(CrisisObject).all()]


@router.get("/{crisis_id}/")
def get_crisis(crisis_id: str, db: Session = Depends(get_db)):
    """Full details for a single crisis-map object."""
    c = db.query(CrisisObject).filter(CrisisObject.id == crisis_id).first()
    if c is None:
        raise HTTPException(status_code=404, detail=f"Crisis object {crisis_id} does not exist")
    return serialize(c)
