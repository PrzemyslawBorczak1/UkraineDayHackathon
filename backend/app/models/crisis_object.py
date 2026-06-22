from datetime import datetime
from typing import Optional

from sqlalchemy import String, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from geoalchemy2 import Geometry

from app.database import Base


class CrisisObject(Base):
    """
    Crisis map object entity (CM001-CM055).

    Represents points of interest on the crisis map:
    collection points, crisis hubs, closed roads, risk zones, etc.
    """
    __tablename__ = "crisis_map"

    id: Mapped[str] = mapped_column(String(10), primary_key=True)
    object_type: Mapped[str] = mapped_column(String(30))
    name: Mapped[str] = mapped_column(String(100))
    city: Mapped[str] = mapped_column(String(50))
    voivodeship: Mapped[str] = mapped_column(String(50))
    geom: Mapped[str] = mapped_column(Geometry("POINT", srid=4326))
    severity: Mapped[str] = mapped_column(String(15))
    status: Mapped[str] = mapped_column(String(15))
    estimated_update_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    operational_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
