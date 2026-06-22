"""Event handlers for emitting and replaying events."""
import json
from typing import Optional

from sqlalchemy.orm import Session

from app.models.mission import Mission, MissionStatus
from app.events.types import EventType
from app.events.mission_event import MissionEvent
from app.events.transitions import STATE_TRANSITIONS


def emit_event(
    db: Session,
    mission_id: str,
    event_type: str,
    actor: str,
    payload: Optional[dict] = None
) -> MissionEvent:
    """
    Emit an event and update mission state.

    Args:
        db: Database session
        mission_id: Mission ID
        event_type: Event type (use EventType constants)
        actor: Actor identifier (e.g., "system", "driver:D001", "coordinator:C001")
        payload: Optional event payload as dict

    Returns:
        The created MissionEvent
    """
    mission = db.query(Mission).filter(Mission.id == mission_id).first()
    if not mission:
        raise ValueError(f"Mission {mission_id} not found")

    # Create event
    event = MissionEvent(
        mission_id=mission_id,
        event_type=event_type,
        actor=actor,
        payload=json.dumps(payload) if payload else None
    )
    db.add(event)

    # Apply state transition
    current_state = mission.status
    transition_key = (current_state, event_type)

    if transition_key in STATE_TRANSITIONS:
        new_state = STATE_TRANSITIONS[transition_key]
        mission.status = new_state

        # Handle assignment payload
        if event_type == EventType.ALLOCATION_ASSIGNED and payload:
            mission.assigned_vehicle_id = payload.get("vehicle_id")
            mission.assigned_carrier_id = payload.get("carrier_id")
            mission.assignment_score = payload.get("score")
            mission.assignment_reason = payload.get("reason")

        # Handle deferral/queue reason
        if event_type in (EventType.ALLOCATION_DEFERRED, EventType.COORDINATOR_DEFER) and payload:
            mission.deferral_reason = payload.get("reason")
        if event_type == EventType.ALLOCATION_QUEUED and payload:
            mission.deferral_reason = payload.get("reason")

    db.commit()
    db.refresh(event)
    return event


def get_mission_history(db: Session, mission_id: str) -> list[MissionEvent]:
    """
    Get all events for a mission in chronological order.

    Args:
        db: Database session
        mission_id: Mission ID

    Returns:
        List of MissionEvent objects ordered by timestamp
    """
    return (
        db.query(MissionEvent)
        .filter(MissionEvent.mission_id == mission_id)
        .order_by(MissionEvent.timestamp, MissionEvent.id)
        .all()
    )


def replay_mission_state(db: Session, mission_id: str) -> str:
    """
    Replay all events to compute current state.

    This is the authoritative state computation.
    Event log is the source of truth; Mission.status is just a cache.

    Args:
        db: Database session
        mission_id: Mission ID

    Returns:
        Current mission status after replaying all events
    """
    events = get_mission_history(db, mission_id)

    state = MissionStatus.NEW
    for event in events:
        transition_key = (state, event.event_type)
        if transition_key in STATE_TRANSITIONS:
            state = STATE_TRANSITIONS[transition_key]

    return state
