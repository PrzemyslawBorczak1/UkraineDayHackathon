from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from geoalchemy2 import Geometry

from app.database import Base


# Mission status constants
class MissionStatus:
    NEW = "NEW"                  # created, awaiting carrier acceptance
    ACCEPTED = "ACCEPTED"        # origin-warehouse carrier made it available
    IN_PROGRESS = "IN_PROGRESS"  # execution started
    DONE = "DONE"                # completed


class Mission(Base):
    """
    Mission entity (M0001-M4000).

    Represents a humanitarian cargo transport mission.
    """
    __tablename__ = "missions"

    id: Mapped[str] = mapped_column(String(10), primary_key=True)
    cargo_type: Mapped[str] = mapped_column(String(50))
    origin_point: Mapped[str] = mapped_column(String(50))
    origin_geom: Mapped[str] = mapped_column(Geometry("POINT", srid=4326))
    origin_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    destination_point: Mapped[str] = mapped_column(String(50))
    dest_geom: Mapped[str] = mapped_column(Geometry("POINT", srid=4326))
    dest_address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # Route polyline (filled later by a routing provider, e.g. Geoapify). The
    # coordinator panel interpolates truck position along this geometry.
    route_geom: Mapped[Optional[str]] = mapped_column(
        Geometry("LINESTRING", srid=4326), nullable=True
    )
    route_distance_km: Mapped[int] = mapped_column(Integer)
    weight_t: Mapped[float] = mapped_column(Float)
    volume_m3: Mapped[float] = mapped_column(Float)
    required_vehicle_type: Mapped[str] = mapped_column(String(20))
    priority: Mapped[str] = mapped_column(String(10))
    available_from: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    deadline: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    estimated_cost: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(20), default=MissionStatus.NEW)
    requesting_authority: Mapped[str] = mapped_column(String(100))
    special_requirement: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Structured requirements parsed from special_requirement note.
    # Used by the allocation engine to match against vehicle capabilities
    # (temperature_controlled / adr_enabled / liftgate). When the note does not
    # carry the info: temperature -> NULL, ADR/liftgate -> False.
    required_temperature: Mapped[Optional[list[int]]] = mapped_column(
        ARRAY(Integer), nullable=True
    )  # [min_c, max_c], e.g. [2, 8]
    certificate_adr: Mapped[bool] = mapped_column(Boolean, default=False)
    liftgate: Mapped[bool] = mapped_column(Boolean, default=False)

    @property
    def temperature_range(self) -> Optional[tuple[int, int]]:
        """Required temperature as a (min_c, max_c) tuple, or None."""
        if self.required_temperature is None:
            return None
        return tuple(self.required_temperature)  # type: ignore[return-value]

    # Assignment tracking (filled when mission is assigned)
    assigned_vehicle_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("vehicles.id"), nullable=True
    )
    assigned_carrier_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("carriers.id"), nullable=True
    )
    assignment_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    assignment_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Deferral/Queue reason
    deferral_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
