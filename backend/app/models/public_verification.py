from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Integer, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.carrier import Carrier


# Verification result constants
class VerificationResult:
    APPROVED = "Approved"
    MANUAL_REVIEW = "Manual review"
    DO_NOT_USE = "Do not use"


class PublicVerification(Base):
    """
    Public verification entity (1:1 with Carrier).

    Contains verification data from public registries.
    """
    __tablename__ = "public_verification"

    carrier_id: Mapped[str] = mapped_column(
        ForeignKey("carriers.id"), primary_key=True
    )
    company_registry_status: Mapped[str] = mapped_column(String(20))
    transport_licence_status: Mapped[str] = mapped_column(String(20))
    insurance_status: Mapped[str] = mapped_column(String(20))
    tax_arrears: Mapped[str] = mapped_column(String(10))
    sanctions_screening_result: Mapped[str] = mapped_column(String(20))
    registry_match_quality: Mapped[str] = mapped_column(String(20))
    incidents_24m: Mapped[int] = mapped_column(Integer)
    documentation_completeness_pct: Mapped[int] = mapped_column(Integer)
    public_verification_score: Mapped[int] = mapped_column(Integer)  # 0-100
    verification_result: Mapped[str] = mapped_column(String(20))
    verification_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    carrier: Mapped["Carrier"] = relationship(back_populates="verification")
