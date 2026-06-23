"""Deterministic carrier verification engine.

Given a carrier's public-verification fields, decide:

  * status  -> Approved | Manual review | Do not use
  * risk    -> Low | Medium | High  (derived from the status tier)

The rules come straight from the challenge instruction:

  - CHALLENGE_CASE.md §12: "Verification is a hard filter, not a soft signal.
    Do Not Use carriers must be excluded before scoring."
  - CHALLENGE_CASE.md §9.1: Approved ~ score >= 78, valid docs, active registry;
    Manual review = borderline score or minor documentation issues;
    Do not use = confirmed sanctions, liquidation or critically low score.
  - data_dictionary.csv: Registry Match Quality maps High->Approved /
    Medium->Manual review / Low->Do not use (a restatement of the outcome, so it
    is NOT used as an input here — we decide from the underlying drivers instead).

Pure stdlib, no ORM or network dependencies, so it is trivially testable and can
be wired to the SQLAlchemy PublicVerification model (or to free-text input) later.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


# --- Outcome vocabularies (match the dataset's exact strings) ---------------

class VerificationStatus:
    APPROVED = "Approved"
    MANUAL_REVIEW = "Manual review"
    DO_NOT_USE = "Do not use"


class RiskTier:
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


# Status -> verification-derived risk tier.
_STATUS_TO_RISK = {
    VerificationStatus.APPROVED: RiskTier.LOW,
    VerificationStatus.MANUAL_REVIEW: RiskTier.MEDIUM,
    VerificationStatus.DO_NOT_USE: RiskTier.HIGH,
}


# --- Thresholds (from CHALLENGE_CASE.md §9.1) -------------------------------

# Approved requires a public verification score at or above this.
APPROVED_SCORE_THRESHOLD = 78

# This many recorded incidents (or more) forces a manual review.
INCIDENT_MANUAL_THRESHOLD = 3


def _norm(value: Optional[str]) -> str:
    """Lower-cased, stripped string for tolerant comparisons."""
    return (value or "").strip().lower()


@dataclass
class VerificationRecord:
    """Raw public-verification inputs for a single carrier.

    Field names mirror the public_verification dataset columns.
    """
    carrier_id: str
    company_registry_status: str        # Active | Pending review | Suspended | Liquidation
    transport_licence_status: str       # Valid | Expiring soon | No
    insurance_status: str               # Valid | Expiring soon | No
    tax_arrears: str                    # No | Minor
    sanctions_screening_result: str     # No | Pending | Confirmed match
    incidents_24m: int
    public_verification_score: int      # 0-100, composite (see data_dictionary.csv)


@dataclass
class Verdict:
    """Result of evaluating a VerificationRecord."""
    carrier_id: str
    status: str                         # one of VerificationStatus
    risk: str                           # one of RiskTier (derived from status)
    score: int
    triggered_rules: list[str] = field(default_factory=list)

    @property
    def hard_excluded(self) -> bool:
        """True when the carrier was excluded by a hard filter (sanctions/liquidation)."""
        return self.status == VerificationStatus.DO_NOT_USE


def evaluate(record: VerificationRecord) -> Verdict:
    """Compute status + risk for one carrier, following the instruction rubric.

    Priority order (first match wins):

      1. HARD EXCLUSION -> Do not use
         - sanctions screening == "Confirmed match", or
         - company registry == "Liquidation".
         These override the score entirely (§12).

      2. SOFT FLAGS -> Manual review (any of):
         - score below the approval threshold,
         - incidents >= the manual-review threshold,
         - insurance not "Valid" (expiring soon / none),
         - transport licence not "Valid",
         - company registry not "Active" (pending review / suspended),
         - any tax arrears (Minor),
         - sanctions screening "Pending".

      3. Otherwise -> Approved.
    """
    reasons: list[str] = []

    # --- 1. Hard exclusions (a Do-not-use carrier is never scored) ----------
    if _norm(record.sanctions_screening_result) == "confirmed match":
        reasons.append("sanctions_confirmed_match")
    if _norm(record.company_registry_status) == "liquidation":
        reasons.append("company_in_liquidation")

    if reasons:
        return _verdict(record, VerificationStatus.DO_NOT_USE, reasons)

    # --- 2. Soft flags (any one forces a manual review) ---------------------
    if record.public_verification_score < APPROVED_SCORE_THRESHOLD:
        reasons.append("score_below_threshold")
    if record.incidents_24m >= INCIDENT_MANUAL_THRESHOLD:
        reasons.append("incidents_over_threshold")
    if _norm(record.insurance_status) != "valid":
        reasons.append("insurance_not_valid")
    if _norm(record.transport_licence_status) != "valid":
        reasons.append("transport_licence_not_valid")
    if _norm(record.company_registry_status) != "active":
        reasons.append("registry_not_active")
    if _norm(record.tax_arrears) not in ("", "no"):
        reasons.append("tax_arrears")
    if _norm(record.sanctions_screening_result) == "pending":
        reasons.append("sanctions_pending")

    if reasons:
        return _verdict(record, VerificationStatus.MANUAL_REVIEW, reasons)

    # --- 3. Clean -> Approved ----------------------------------------------
    return _verdict(record, VerificationStatus.APPROVED, ["clean"])


def _verdict(record: VerificationRecord, status: str, reasons: list[str]) -> Verdict:
    return Verdict(
        carrier_id=record.carrier_id,
        status=status,
        risk=_STATUS_TO_RISK[status],
        score=record.public_verification_score,
        triggered_rules=reasons,
    )


# --- Public Verification Score (composite) ----------------------------------
#
# Formula from data_dictionary.csv:
#   PVS = Reliability×0.4 + DocCompleteness×0.3 + RegistryBonus×0.2 + IncidentScore×0.1
#
# RegistryBonus by company registry status: Active and Liquidation are anchored
# by the dataset; Pending review / Suspended are documented assumptions.
_REGISTRY_BONUS = {
    "active": 100,
    "pending review": 60,
    "suspended": 30,
    "liquidation": 0,
}


def compute_score(
    *,
    reliability_score: int,
    documentation_completeness_pct: int,
    company_registry_status: str,
    incidents_24m: int,
) -> int:
    """Composite Public Verification Score (0-100), per data_dictionary.csv.

    Used when a carrier has no pre-computed score (e.g. a freshly registered
    company whose public-registry data was just gathered/mocked).
    """
    incident_score = max(0, 100 - incidents_24m * 25)
    registry_bonus = _REGISTRY_BONUS.get(_norm(company_registry_status), 50)
    raw = (
        reliability_score * 0.4
        + documentation_completeness_pct * 0.3
        + registry_bonus * 0.2
        + incident_score * 0.1
    )
    return max(0, min(100, round(raw)))
