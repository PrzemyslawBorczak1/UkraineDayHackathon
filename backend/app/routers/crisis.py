"""Crisis map endpoints (coordinator side).

List returns lean fields for the map/filtering; the by-id endpoint returns the
full model.
"""
from fastapi import APIRouter, Depends, HTTPException
from geoalchemy2.shape import to_shape
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import CrisisObject
from app.serialize import serialize

router = APIRouter(prefix="/crisis", tags=["crisis"])


def _summary(o: CrisisObject) -> dict:
    """Lean shape for list/map/filter views."""
    point = to_shape(o.geom)
    return {
        "id": o.id,
        "object_type": o.object_type,
        "name": o.name,
        "city": o.city,
        "voivodeship": o.voivodeship,
        "severity": o.severity,
        "status": o.status,
        "lat": point.y,
        "lng": point.x,
    }


@router.get("/")
def list_crisis_objects(db: Session = Depends(get_db)):
    """List crisis-map objects (summary fields only)."""
    return [_summary(o) for o in db.query(CrisisObject).all()]


@router.get("/{object_id}/")
def get_crisis_object(object_id: str, db: Session = Depends(get_db)):
    """Full details for a single crisis-map object."""
    o = db.query(CrisisObject).filter(CrisisObject.id == object_id).first()
    if o is None:
        raise HTTPException(status_code=404, detail=f"Crisis object {object_id} does not exist")
    return serialize(o)
