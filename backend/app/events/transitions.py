"""State transition rules for the mission state machine.

Flow: NEW -> ACCEPTED -> IN_PROGRESS -> DONE
  - NEW:         created, awaiting acceptance by the origin-warehouse carrier
  - ACCEPTED:    carrier made the origin warehouse available
  - IN_PROGRESS: execution started (allocation done / driver en route)
  - DONE:        delivered
"""
from app.events.types import EventType
from app.models.mission import MissionStatus


# (current_state, event_type) -> new_state
STATE_TRANSITIONS = {
    (MissionStatus.NEW, EventType.CARRIER_ACCEPT_MISSION): MissionStatus.ACCEPTED,
    (MissionStatus.ACCEPTED, EventType.ALLOCATION_ASSIGNED): MissionStatus.IN_PROGRESS,
    (MissionStatus.ACCEPTED, EventType.DRIVER_EN_ROUTE): MissionStatus.IN_PROGRESS,
    (MissionStatus.IN_PROGRESS, EventType.DRIVER_DELIVERED): MissionStatus.DONE,
}
