from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from geoalchemy2 import Geometry

from app.database import Base


# Mission status constants
class MissionStatus:
    # Normal flow
    NEW = "NEW"
    PENDING = "Pending"  # from CSV
    FUNDED = "FUNDED"
    ASSIGNED = "ASSIGNED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    CLOSED = "CLOSED"
    # Exception branches
    DEFERRED = "DEFERRED"    # no budget
    QUEUED = "QUEUED"        # no resource (e.g., refrigeration)
    INCIDENT = "INCIDENT"    # breakdown/failure
    REASSIGN = "REASSIGN"    # recovered, needs re-allocation


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
    destination_point: Mapped[str] = mapped_column(String(50))
    dest_geom: Mapped[str] = mapped_column(Geometry("POINT", srid=4326))
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
