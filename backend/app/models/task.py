from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.vehicle import Vehicle
    from app.models.mission import Mission


# Task phase constants (a task moves through these during execution).
class TaskStatus:
    TRAVELING = "Traveling"            # driving to origin (empty)
    TRANSPORTING = "Transporting"      # driving with cargo
    PREPARE_UNLOAD = "PrepareUnload"   # arrived, preparing to unload
    UNLOAD = "Unload"                  # unloading
    WAIT = "Wait"                      # waiting (e.g. warehouse closed)


class Task(Base):
    """
    Task entity.

    A task is a granular unit of work: a (part of a) mission assigned to a
    single vehicle. Missions are divisible — one mission can be split across
    several tasks/vehicles.

    Mirrors an allocation-engine *interval*: a vehicle's stage of executing a
    mission. Holds the phase (`status`), its time window (`start_date`/
    `end_date`), the mission reference, and the cargo taken in this interval
    (`allocated_weight`/`allocated_volume`).
    """
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    vehicle_id: Mapped[str] = mapped_column(ForeignKey("vehicles.id"), index=True)
    mission_id: Mapped[str] = mapped_column(ForeignKey("missions.id"), index=True)
    status: Mapped[str] = mapped_column(String(20), default=TaskStatus.WAIT)
    start_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    end_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    # Cargo moved in this interval (engine MissionAssignment.allocated_*).
    allocated_weight: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    allocated_volume: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Relationships
    vehicle: Mapped["Vehicle"] = relationship()
    mission: Mapped["Mission"] = relationship()
