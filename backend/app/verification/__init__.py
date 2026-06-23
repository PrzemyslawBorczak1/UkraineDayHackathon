"""Carrier verification engine.

Computes a carrier's verification *status* (Approved / Manual review / Do not use)
and *risk* tier from public-registry data, following the rubric defined in the
challenge dataset (scoring_model.csv, data_dictionary.csv, CHALLENGE_CASE.md §9.1/§12).

The decision is fully deterministic and auditable. A natural-language explanation
layer (Claude) can be added on top later; this module is the source of truth for
the verdict itself.
"""
from app.verification.engine import (
    VerificationRecord,
    Verdict,
    VerificationStatus,
    RiskTier,
    evaluate,
    compute_score,
    APPROVED_SCORE_THRESHOLD,
    INCIDENT_MANUAL_THRESHOLD,
)

__all__ = [
    "VerificationRecord",
    "Verdict",
    "VerificationStatus",
    "RiskTier",
    "evaluate",
    "compute_score",
    "APPROVED_SCORE_THRESHOLD",
    "INCIDENT_MANUAL_THRESHOLD",
]
