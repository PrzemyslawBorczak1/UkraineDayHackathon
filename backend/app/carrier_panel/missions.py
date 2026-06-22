"""Acceptance-status store for the carrier panel.

Missions come from the shared PostgreSQL DB (assigned_carrier_id filter).
Acceptance decisions (Pending / Accepted / Rejected) are persisted here in RAM
for the duration of the server process — good enough for a demo.
"""

# mission_id → "Pending" | "Accepted" | "Rejected"
_acceptance: dict[str, str] = {}


def get_acceptance(mission_id: str, default: str = "Pending") -> str:
    return _acceptance.get(mission_id, default)


def set_acceptance(mission_id: str, status: str) -> None:
    _acceptance[mission_id] = status
