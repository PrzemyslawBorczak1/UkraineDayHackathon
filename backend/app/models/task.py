from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import Integer, String, DateTime, ForeignKey
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

    Links (task -> vehicle -> mission) plus a phase status and its time window.
    Cargo metadata (cargo_type, volume_t, weight_t) will be added later.
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

    # Relationships
    vehicle: Mapped["Vehicle"] = relationship()
    mission: Mapped["Mission"] = relationship()
