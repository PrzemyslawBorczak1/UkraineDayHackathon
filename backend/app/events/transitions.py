"""State transition rules for mission state machine."""
from app.events.types import EventType
from app.models.mission import MissionStatus


# State transition rules: (current_state, event_type) -> new_state
STATE_TRANSITIONS = {
    # Normal flow
    (MissionStatus.NEW, EventType.COORDINATOR_FUND): MissionStatus.FUNDED,
    (MissionStatus.PENDING, EventType.COORDINATOR_FUND): MissionStatus.FUNDED,
    (MissionStatus.FUNDED, EventType.ALLOCATION_ASSIGNED): MissionStatus.ASSIGNED,
    (MissionStatus.ASSIGNED, EventType.CARRIER_ACCEPT_MISSION): MissionStatus.ASSIGNED,
    (MissionStatus.ASSIGNED, EventType.DRIVER_ACCEPT): MissionStatus.ASSIGNED,
    (MissionStatus.ASSIGNED, EventType.DRIVER_EN_ROUTE): MissionStatus.IN_TRANSIT,
    (MissionStatus.IN_TRANSIT, EventType.DRIVER_DELIVERED): MissionStatus.DELIVERED,
    (MissionStatus.DELIVERED, EventType.SYSTEM_MISSION_ARRIVED): MissionStatus.CLOSED,

    # Exception branches
    (MissionStatus.NEW, EventType.COORDINATOR_DEFER): MissionStatus.DEFERRED,
    (MissionStatus.PENDING, EventType.COORDINATOR_DEFER): MissionStatus.DEFERRED,
    (MissionStatus.NEW, EventType.ALLOCATION_DEFERRED): MissionStatus.DEFERRED,
    (MissionStatus.PENDING, EventType.ALLOCATION_DEFERRED): MissionStatus.DEFERRED,
    (MissionStatus.FUNDED, EventType.ALLOCATION_QUEUED): MissionStatus.QUEUED,
    (MissionStatus.IN_TRANSIT, EventType.DRIVER_REPORT_FAULT): MissionStatus.INCIDENT,
    (MissionStatus.INCIDENT, EventType.COORDINATOR_MANUAL_REASSIGN): MissionStatus.REASSIGN,
    (MissionStatus.REASSIGN, EventType.ALLOCATION_ASSIGNED): MissionStatus.ASSIGNED,

    # Recovery paths
    (MissionStatus.QUEUED, EventType.ALLOCATION_ASSIGNED): MissionStatus.ASSIGNED,
    (MissionStatus.DEFERRED, EventType.COORDINATOR_FUND): MissionStatus.FUNDED,
    (MissionStatus.ASSIGNED, EventType.CARRIER_DECLINE_MISSION): MissionStatus.FUNDED,
}
