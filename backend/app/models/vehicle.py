from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Integer, Float, Boolean, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.database import Base

if TYPE_CHECKING:
    from app.models.carrier import Carrier


class Vehicle(Base):
    """
    Vehicle entity (V0001+).

    Represents a vehicle owned by a carrier.
    """
    __tablename__ = "vehicles"

    id: Mapped[str] = mapped_column(String(10), primary_key=True)
    carrier_id: Mapped[str] = mapped_column(ForeignKey("carriers.id"))
    vehicle_type: Mapped[str] = mapped_column(String(20))
    gvw_t: Mapped[float] = mapped_column(Float)  # Gross Vehicle Weight
    payload_t: Mapped[float] = mapped_column(Float)
    volume_m3: Mapped[int] = mapped_column(Integer)
    temperature_controlled: Mapped[bool] = mapped_column(Boolean)
    adr_enabled: Mapped[bool] = mapped_column(Boolean)
    liftgate: Mapped[bool] = mapped_column(Boolean)
    current_city: Mapped[str] = mapped_column(String(50))
    current_geom: Mapped[str] = mapped_column(Geometry("POINT", srid=4326))
    availability_status: Mapped[str] = mapped_column(String(20))
    activation_time_hours: Mapped[int] = mapped_column(Integer)
    operational_range_km: Mapped[int] = mapped_column(Integer)
    restriction_note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    carrier: Mapped["Carrier"] = relationship(back_populates="vehicles")
