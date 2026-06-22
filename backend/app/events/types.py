"""Event type definitions."""


class EventType:
    """
    Event types for mission state transitions.

    Categories:
    - DRIVER_*: Events emitted by drivers
    - CARRIER_*: Events emitted by carriers
    - COORDINATOR_*: Events emitted by coordinators
    - SYSTEM_*: Automated system events
    - ALLOCATION_*: Allocation engine events
    """
    # Driver events
    DRIVER_ACCEPT = "driver_accept"
    DRIVER_EN_ROUTE = "driver_en_route"
    DRIVER_AT_ORIGIN = "driver_at_origin"
    DRIVER_LOADED = "driver_loaded"
    DRIVER_DELIVERED = "driver_delivered"
    DRIVER_REPORT_FAULT = "driver_report_fault"
    DRIVER_REQUEST_HELP = "driver_request_help"

    # Carrier events
    CARRIER_ACCEPT_MISSION = "carrier_accept_mission"
    CARRIER_DECLINE_MISSION = "carrier_decline_mission"
    CARRIER_UPDATE_AVAILABILITY = "carrier_update_availability"
    CARRIER_REPORT_DELAY = "carrier_report_delay"

    # Coordinator events
    COORDINATOR_FUND = "coordinator_fund"
    COORDINATOR_DEFER = "coordinator_defer"
    COORDINATOR_APPROVE = "coordinator_approve"
    COORDINATOR_MANUAL_REASSIGN = "coordinator_manual_reassign"
    COORDINATOR_ESCALATE = "coordinator_escalate"
    COORDINATOR_BROADCAST = "coordinator_broadcast"

    # System events
    SYSTEM_MISSION_ARRIVED = "system_mission_arrived"
    SYSTEM_DEADLINE_WARNING = "system_deadline_warning"
    SYSTEM_VEHICLE_RETURNED = "system_vehicle_returned"
    SYSTEM_BUDGET_RESET = "system_budget_reset"
    SYSTEM_ROAD_CLOSURE_UPDATE = "system_road_closure_update"

    # Allocation events
    ALLOCATION_ASSIGNED = "allocation_assigned"
    ALLOCATION_QUEUED = "allocation_queued"
    ALLOCATION_DEFERRED = "allocation_deferred"
