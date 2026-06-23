"""Carrier self-service panel (isolated MVP).

A standalone FastAPI app + in-RAM store for the carrier-facing flow:
register a new company -> mock public-registry data -> run the real
verification engine -> show the verdict. Kept fully separate from the
shared backend (own app, own port) so it doesn't interfere with other work.

Run:  uvicorn app.carrier_panel.app:app --port 8001 --reload
"""
