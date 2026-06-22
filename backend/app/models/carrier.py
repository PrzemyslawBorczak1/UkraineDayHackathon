from datetime import date
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import String, Integer, Float, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.database import Base

if TYPE_CHECKING:
    from app.models.vehicle import Vehicle
    from app.models.warehouse import Warehouse
    from app.models.public_verification import PublicVerification


class Carrier(Base):
    """
    Carrier entity (C001-C050).

    Represents a logistics carrier registered in the crisis coordination system.
    """
    __tablename__ = "carriers"

    id: Mapped[str] = mapped_column(String(10), primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    tax_id: Mapped[str] = mapped_column(String(15))  # PL + 10 digits
    hq_city: Mapped[str] = mapped_column(String(50))
    voivodeship: Mapped[str] = mapped_column(String(50))
    hq_geom: Mapped[str] = mapped_column(Geometry("POINT", srid=4326))
    activity_type: Mapped[str] = mapped_column(String(50))
    declared_fleet_size: Mapped[int] = mapped_column(Integer)
    declared_warehouse_capacity_m2: Mapped[int] = mapped_column(Integer)
    crisis_participation_status: Mapped[str] = mapped_column(String(30))
    documentation_status: Mapped[str] = mapped_column(String(20))
    insurance_expiry_date: Mapped[date] = mapped_column(Date)
    transport_licence_expiry_date: Mapped[date] = mapped_column(Date)
    declared_activation_time_hours: Mapped[int] = mapped_column(Integer)
    reliability_score: Mapped[int] = mapped_column(Integer)  # 0-100
    risk_rating: Mapped[str] = mapped_column(String(10))
    cost_per_km: Mapped[float] = mapped_column(Float)
    preferred_contact_channel: Mapped[str] = mapped_column(String(30))
    operating_region: Mapped[str] = mapped_column(String(50))

    # Relationships
    vehicles: Mapped[List["Vehicle"]] = relationship(back_populates="carrier")
    warehouses: Mapped[List["Warehouse"]] = relationship(back_populates="carrier")
    verification: Mapped[Optional["PublicVerification"]] = relationship(back_populates="carrier")
