"""Allocation endpoint (coordinator side).

Runs the ALNS scheduler for a day and persists the schedule as Tasks.
"""
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.allocation.pipeline import run_allocation

router = APIRouter(prefix="/api/v1", tags=["allocation"])


@router.post("/allocate")
def allocate(
    day: Optional[date] = Query(None, description="First day to schedule (YYYY-MM-DD); defaults to earliest"),
    iterations: int = Query(2, ge=0, le=2000),
    days: Optional[int] = Query(None, ge=1, le=120, description="Window length in days; omit = ALL missions"),
    db: Session = Depends(get_db),
):
    """Run allocation over a window and (re)write Task rows. Returns a summary."""
    return run_allocation(db, day=day, iterations=iterations, days=days)
