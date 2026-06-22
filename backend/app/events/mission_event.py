"""MissionEvent model - append-only event log."""
from datetime import datetime
from typing import Optional

from sqlalchemy import String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class MissionEvent(Base):
    """
    Append-only event log for missions.

    This is the source of truth for mission state.
    Mission.status is just a cached projection of this log.
    """
    __tablename__ = "mission_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    mission_id: Mapped[str] = mapped_column(ForeignKey("missions.id"), index=True)
    event_type: Mapped[str] = mapped_column(String(50))
    actor: Mapped[str] = mapped_column(String(50))  # system, driver:<id>, carrier:<id>, coordinator:<id>
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    payload: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON
