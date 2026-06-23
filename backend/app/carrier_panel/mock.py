"""Mock 'public-registry' data for newly registered carriers.

We don't have real KRS / VIES / sanctions APIs, so we synthesise the public
verification fields. Choices are *weighted* (not uniform) so the resulting mix
roughly matches the challenge's ~40% Approved / 44% Manual / 16% Do-not-use
split — uniform randomness would flag far too many companies and make the demo
look broken.
"""
import random


def _weighted(options: list[tuple[str, float]]) -> str:
    values, weights = zip(*options)
    return random.choices(values, weights=weights, k=1)[0]


def generate_public_data() -> dict:
    """Return mocked public-registry fields for one new carrier."""
    return {
        "company_registry_status": _weighted([
            ("Active", 0.88),
            ("Pending review", 0.04),
            ("Suspended", 0.03),
            ("Liquidation", 0.05),
        ]),
        "transport_licence_status": _weighted([
            ("Valid", 0.88),
            ("Expiring soon", 0.09),
            ("No", 0.03),
        ]),
        "insurance_status": _weighted([
            ("Valid", 0.88),
            ("Expiring soon", 0.09),
            ("No", 0.03),
        ]),
        "tax_arrears": _weighted([
            ("No", 0.90),
            ("Minor", 0.10),
        ]),
        "sanctions_screening_result": _weighted([
            ("No", 0.91),
            ("Pending", 0.02),
            ("Confirmed match", 0.07),
        ]),
        "incidents_24m": random.choices(
            [0, 1, 2, 3, 4], weights=[0.55, 0.27, 0.10, 0.05, 0.03], k=1
        )[0],
        "documentation_completeness_pct": random.randint(68, 100),
        "reliability_score": random.randint(58, 97),
    }
