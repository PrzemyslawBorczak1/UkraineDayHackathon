"""Lightweight ORM -> dict serialization for API responses.

MVP helper: dumps all mapped columns of a model instance, converting
PostGIS geometry to {lat, lng} and datetimes/dates to ISO strings so the
result is JSON-serializable. Good enough until we define real schemas.
"""
from datetime import datetime, date

from geoalchemy2.elements import WKBElement
from geoalchemy2.shape import to_shape
from shapely.geometry import mapping, Point
from sqlalchemy import inspect as sa_inspect


def _geom_to_json(value: WKBElement):
    """POINT -> {lat, lng}; any other geometry -> GeoJSON dict."""
    shape = to_shape(value)
    if isinstance(shape, Point):
        return {"lat": shape.y, "lng": shape.x}
    return mapping(shape)


def serialize(obj) -> dict:
    """Serialize a single SQLAlchemy model instance to a plain dict."""
    result: dict = {}
    for attr in sa_inspect(obj).mapper.column_attrs:
        value = getattr(obj, attr.key)
        if isinstance(value, WKBElement):
            value = _geom_to_json(value)
        elif isinstance(value, (datetime, date)):
            value = value.isoformat()
        result[attr.key] = value
    return result


def serialize_list(objs) -> list[dict]:
    return [serialize(o) for o in objs]
