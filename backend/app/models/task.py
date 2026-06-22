from typing import TYPE_CHECKING

from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.vehicle import Vehicle
    from app.models.mission import Mission


class Task(Base):
    """
    Task entity.

    A task is a granular unit of work: a (part of a) mission assigned to a
    single vehicle. Missions are divisible — one mission can be split across
    several tasks/vehicles.

    MVP keeps only the links (task -> vehicle -> mission). Later we add task
    metadata: cargo_type, volume_t, weight_t, start/end times.
    """
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    vehicle_id: Mapped[str] = mapped_column(ForeignKey("vehicles.id"), index=True)
    mission_id: Mapped[str] = mapped_column(ForeignKey("missions.id"), index=True)

    # Relationships
    vehicle: Mapped["Vehicle"] = relationship()
    mission: Mapped["Mission"] = relationship()
