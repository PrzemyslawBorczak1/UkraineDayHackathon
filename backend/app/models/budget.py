from typing import Optional

from sqlalchemy import String, Integer, Float, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Budget(Base):
    """
    Budget entity.

    Represents budget constraints for mission funding.
    """
    __tablename__ = "budget"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    period: Mapped[str] = mapped_column(String(20))  # Daily/Weekly/Monthly
    budget_ceiling: Mapped[float] = mapped_column(Float)
    estimated_mission_demand: Mapped[float] = mapped_column(Float)
    fundable_pct: Mapped[float] = mapped_column(Float)
    unfunded_pct: Mapped[float] = mapped_column(Float)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
