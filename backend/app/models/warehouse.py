from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.database import Base

if TYPE_CHECKING:
    from app.models.carrier import Carrier


class Warehouse(Base):
    """
    Warehouse entity (W001-W025).

    Represents a warehouse facility owned by a carrier.
    """
    __tablename__ = "warehouses"

    id: Mapped[str] = mapped_column(String(10), primary_key=True)
    carrier_id: Mapped[str] = mapped_column(ForeignKey("carriers.id"))
    name: Mapped[str] = mapped_column(String(100))
    city: Mapped[str] = mapped_column(String(50))
    voivodeship: Mapped[str] = mapped_column(String(50))
    geom: Mapped[str] = mapped_column(Geometry("POINT", srid=4326))
    warehouse_type: Mapped[str] = mapped_column(String(30))
    area_m2: Mapped[int] = mapped_column(Integer)
    dock_doors: Mapped[int] = mapped_column(Integer)
    cold_storage: Mapped[bool] = mapped_column(Boolean)
    on_site_security: Mapped[bool] = mapped_column(Boolean)
    operating_hours: Mapped[str] = mapped_column(String(20))
    available_capacity_pct: Mapped[int] = mapped_column(Integer)
    availability_status: Mapped[str] = mapped_column(String(30))
    activation_time_hours: Mapped[int] = mapped_column(Integer)

    # Relationships
    carrier: Mapped["Carrier"] = relationship(back_populates="warehouses")
