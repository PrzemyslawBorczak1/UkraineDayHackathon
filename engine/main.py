from datetime import datetime, timedelta, time
from enum import Enum
from dataclasses import dataclass, field
import random
import math


class Status(Enum):
    PASSIVE_WAITING = 1
    ACTIVE_WAITING = 2
    IN_PROGRESS_ACTIVE = 3
    IN_PROGRESS_PASSIVE = 4
    UNLOADING = 5


class Priority(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3


class State(Enum):
    CREATED = 1
    IN_PROGRESS = 2
    CLOSED = 3


class VehicleType(Enum):
    RIGID_TRUCK = 1
    STANDARD_SEMI = 2
    VAN = 3
    BDF_SWAP_BODY = 4
    REFRIGERATED_SEMI = 5


@dataclass
class Location:
    latitude: float
    longitude: float
    name: str | None = None

    def distance(self, other: "Location") -> float:
        R = 6371.0
        lat1 = math.radians(self.latitude)
        lon1 = math.radians(self.longitude)
        lat2 = math.radians(other.latitude)
        lon2 = math.radians(other.longitude)
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c


@dataclass
class Temperature:
    min: float
    max: float


@dataclass
class Carrier:
    id: str
    location: Location
    price_per_km: float
    reliability_score: int
    public_verification_score: float
    incident_score: float
    operational_resilience: float


@dataclass
class Budget:
    daily: float
    weekly: float
    monthly: float


@dataclass
class Mission:
    id: str
    origin: "Warehouses"
    destination: "Warehouses"
    priority: Priority
    available_from: datetime
    deadline: datetime
    weight: float
    volume: float
    route_distance: float
    state: State = State.CREATED
    cost: float = 0.0
    temperature_required: Temperature | None = None
    adr_required: bool = False
    lift_gate_required: bool = False
    required_vehicle_type: VehicleType | None = None
    additional_notes: str = ""

    assigned_vehicles: list[str] = field(default_factory=list)
    remaining_weight: float = 0.0
    remaining_volume: float = 0.0

    budget_commitment_date: datetime | None = None
    budget_commitment_amount: float = 0.0

    stored_in_temp_weight: float = 0.0
    stored_in_temp_volume: float = 0.0
    bonus: float = 0.0

    def __post_init__(self):
        self.remaining_weight = self.weight
        self.remaining_volume = self.volume

    def is_fully_assigned(self) -> bool:
        return self.remaining_weight <= 0.01 and self.remaining_volume <= 0.01

    def mark_closed_if_complete(self):
        if self.is_fully_assigned() and self.stored_in_temp_weight <= 0:
            self.state = State.CLOSED
            self.remaining_weight = 0.0
            self.remaining_volume = 0.0


@dataclass
class MissionAssignment:
    mission: Mission
    allocated_weight: float
    allocated_volume: float


@dataclass
class TimeInterval:
    start: datetime
    end: datetime
    status: Status
    mission_assignment: MissionAssignment | None = None
    cost: float = 0.0

    def overlaps(self, other_start: datetime, other_end: datetime) -> bool:
        return max(self.start, other_start) < min(self.end, other_end)


@dataclass
class Warehouses:
    id: str
    location: Location
    opening_hours: time
    closing_hours: time
    is_active: bool
    activation_time: float


@dataclass
class TemporaryWarehouse:
    id: str
    location: Location
    expiry: datetime
    assignments: dict[str, tuple[float, float]] = field(default_factory=dict)

    def as_warehouse(self) -> Warehouses:
        return Warehouses(
            id=self.id,
            location=self.location,
            opening_hours=time(0, 0),
            closing_hours=time(23, 59, 59),
            is_active=True,
            activation_time=0.0,
        )


def calculate_score(
    mission: Mission,
    vehicle: "Vehicle",
    max_distance_km: float = 1000.0,
    max_carrier_cost: float = 5000.0,
    active_wait_hours: float = 0.0,
    passive_wait_hours: float = 0.0,
) -> float:
    dist_km = vehicle.get_location_at_time(mission.available_from).distance(
        mission.origin.location
    )
    s_dist = 100 - (min(dist_km, max_distance_km) / max_distance_km) * 100
    activation_hours = mission.origin.activation_time
    s_act = 100 - (min(activation_hours, 12) / 12) * 100

    s_cap = 100
    if mission.adr_required and not vehicle.is_adr_enabled:
        s_cap -= 30
    if mission.lift_gate_required and not vehicle.is_lift_gate_enabled:
        s_cap -= 30
    if mission.temperature_required and not vehicle.is_temperature_controlled:
        s_cap -= 30

    weight_ratio = (
        mission.remaining_weight / vehicle.weight_capacity
        if vehicle.weight_capacity > 0
        else 0
    )
    volume_ratio = (
        mission.remaining_volume / vehicle.volume_capacity
        if vehicle.volume_capacity > 0
        else 0
    )

    if weight_ratio <= 1.0 and volume_ratio <= 1.0:
        s_cap += (weight_ratio + volume_ratio) / 2.0 * 30

    s_ver = vehicle.carrier.public_verification_score
    s_rel = (vehicle.carrier.reliability_score + vehicle.carrier.incident_score) / 2
    carrier_cost = vehicle.carrier.price_per_km * mission.route_distance
    s_cost = 100 - (min(carrier_cost, max_carrier_cost) / max_carrier_cost) * 100

    priority_multiplier = {
        Priority.HIGH: 100000,
        Priority.MEDIUM: 1000,
        Priority.LOW: 0,
    }
    s_priority = priority_multiplier.get(mission.priority, 0)

    penalty_active = active_wait_hours * 1000.0
    penalty_passive = passive_wait_hours * 1.0

    return (
        0.20 * s_dist
        + 0.20 * s_act
        + 0.20 * s_cap
        + 0.15 * s_ver
        + 0.10 * s_rel
        + 0.10 * s_cost
        + 0.05 * vehicle.carrier.operational_resilience
        + s_priority
        - penalty_active
        - penalty_passive
    )


@dataclass
class Vehicle:
    id: str
    carrier: Carrier
    vehicle_type: VehicleType
    is_temperature_controlled: bool
    is_adr_enabled: bool
    is_lift_gate_enabled: bool
    activation_time: float
    weight_capacity: float = 24000.0
    volume_capacity: float = 80.0
    timeSchedule: list[TimeInterval] = field(default_factory=list)

    is_broken: bool = False
    disruption_location: Location | None = None
    locked_until: datetime | None = None

    @property
    def locationsSchedule(self) -> list[MissionAssignment]:
        assignments = []
        for interval in sorted(self.timeSchedule, key=lambda x: x.start):
            if (
                interval.status == Status.IN_PROGRESS_ACTIVE
                and interval.mission_assignment
            ):
                assignments.append(interval.mission_assignment)
        return assignments

    def get_location_at_time(self, target_time: datetime) -> Location:
        if self.is_broken and self.disruption_location:
            return self.disruption_location

        current_loc = self.carrier.location
        sorted_intervals = sorted(self.timeSchedule, key=lambda x: x.start)

        for interval in sorted_intervals:
            if interval.mission_assignment and target_time >= interval.end:
                if interval.status == Status.IN_PROGRESS_ACTIVE:
                    current_loc = (
                        interval.mission_assignment.mission.destination.location
                    )
                elif interval.status == Status.UNLOADING:
                    current_loc = (
                        interval.mission_assignment.mission.destination.location
                    )
                elif interval.status == Status.IN_PROGRESS_PASSIVE:
                    current_loc = interval.mission_assignment.mission.origin.location
        return current_loc

    def get_earliest_available_time(self, after: datetime) -> datetime:
        if self.locked_until and self.locked_until > after:
            earliest = self.locked_until
        else:
            earliest = after

        sorted_intervals = sorted(self.timeSchedule, key=lambda x: x.start)
        for interval in sorted_intervals:
            if interval.end > earliest and interval.start <= earliest:
                earliest = interval.end

        return earliest

    def is_available(
        self, start: datetime, end: datetime, ignore_passive_waiting: bool = False
    ) -> bool:
        if self.is_broken:
            return False
        if self.locked_until and start < self.locked_until:
            return False
        for interval in self.timeSchedule:
            if (
                ignore_passive_waiting
                and interval.status == Status.PASSIVE_WAITING
                and interval.mission_assignment is None
            ):
                continue
            if interval.overlaps(start, end):
                return False
        return True

    def add_intervals(self, intervals: list[TimeInterval]):
        self.timeSchedule.extend(intervals)
        self.timeSchedule.sort(key=lambda x: x.start)


class DailyALNSScheduler:
    def __init__(
        self,
        vehicles: list[Vehicle],
        missions: list[Mission],
        budget: Budget,
        max_passive_waiting_hours: float = float("inf"),
    ):
        self.vehicles = vehicles
        self.missions = missions
        self.daily_budget = budget.daily
        self.max_passive_waiting_hours = max_passive_waiting_hours
        self.temp_warehouses: list[TemporaryWarehouse] = []
        self.total_reward = 0.0
        self._rebuild_unassigned_list()

    def _rebuild_unassigned_list(self):
        self.unassigned_missions = [
            m
            for m in self.missions
            if m.state != State.CLOSED and not m.is_fully_assigned()
        ]

    def estimate_mission_duration(self, distance_km: float) -> timedelta:
        if distance_km <= 0.1:
            return timedelta(hours=0.5)
        return timedelta(hours=(distance_km / 60.0) + 2.0)

    def calculate_daily_spent(self, target_date: datetime) -> float:
        total = 0.0
        for m in self.missions:
            if (
                m.budget_commitment_date is not None
                and m.budget_commitment_date.date() == target_date.date()
            ):
                total += m.budget_commitment_amount
        return total

    def calculate_remaining_budget(self, target_date: datetime) -> float:
        spent = self.calculate_daily_spent(target_date)
        return max(0.0, self.daily_budget - spent)

    def _get_warehouse_hours(
        self, warehouse: Warehouses, target_date: datetime
    ) -> tuple[datetime, datetime]:
        wh_open = datetime.combine(target_date.date(), warehouse.opening_hours)
        wh_close = datetime.combine(target_date.date(), warehouse.closing_hours)
        if wh_close <= wh_open:
            wh_close += timedelta(days=1)
        return wh_open, wh_close

    def _calculate_allocation(
        self,
        mission: Mission,
        vehicle: Vehicle,
        available_weight: float = None,
        available_volume: float = None,
    ) -> tuple[float, float]:
        w = (
            available_weight
            if available_weight is not None
            else mission.remaining_weight
        )
        v = (
            available_volume
            if available_volume is not None
            else mission.remaining_volume
        )
        if w <= 0 or v <= 0:
            return 0.0, 0.0

        weight_factor = vehicle.weight_capacity / w
        volume_factor = vehicle.volume_capacity / v
        factor = min(1.0, weight_factor, volume_factor)
        return w * factor, v * factor

    def _try_assign_vehicle_to_mission(
        self,
        vehicle: Vehicle,
        mission: Mission,
        current_date: datetime,
        remaining_budget: float,
        origin_override: Warehouses = None,
        available_weight: float = None,
        available_volume: float = None,
    ) -> tuple[float, list[TimeInterval], float, float, float] | None:
        if (
            mission.required_vehicle_type is not None
            and vehicle.vehicle_type != mission.required_vehicle_type
        ):
            return None
        if vehicle.is_broken:
            return None

        earliest_start = max(current_date, mission.available_from)
        earliest_start = vehicle.get_earliest_available_time(earliest_start)

        origin = origin_override if origin_override else mission.origin
        single_trip_cost = vehicle.carrier.price_per_km * mission.route_distance

        if mission.state == State.CREATED:
            num_trips = math.ceil(
                max(
                    mission.weight / vehicle.weight_capacity,
                    mission.volume / vehicle.volume_capacity,
                )
            )
            estimated_total_cost = num_trips * single_trip_cost
            if estimated_total_cost > remaining_budget:
                return None

        base_day_midnight = current_date.replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        best_score = -float("inf")
        best_result = None

        for hour_offset in range(0, 48):
            possible_start = base_day_midnight + timedelta(hours=hour_offset)
            if possible_start < earliest_start:
                continue
            if possible_start >= mission.deadline:
                break

            # 🔧 Obliczamy dist_to_origin DLA TEGO konkretnego possible_start
            current_loc = vehicle.get_location_at_time(possible_start)
            dist_to_origin = current_loc.distance(origin.location)
            approach_duration = self.estimate_mission_duration(dist_to_origin)

            arrival_at_origin = possible_start + approach_duration

            if origin_override:
                wh_open = arrival_at_origin - timedelta(seconds=1)
                wh_close = arrival_at_origin + timedelta(days=1)
            else:
                wh_open, wh_close = self._get_warehouse_hours(origin, arrival_at_origin)

            loading_start = max(arrival_at_origin, wh_open)
            if loading_start >= wh_close:
                continue

            transit_duration = self.estimate_mission_duration(mission.route_distance)
            delivery_arrival = loading_start + transit_duration

            wh_dest_open, wh_dest_close = self._get_warehouse_hours(
                mission.destination, delivery_arrival
            )
            delivery_start = max(delivery_arrival, wh_dest_open)
            if delivery_start >= wh_dest_close:
                continue
            if delivery_start > mission.deadline:
                continue

            unloading_time = timedelta(hours=1)
            delivery_end = delivery_start + unloading_time

            if not vehicle.is_available(
                possible_start, delivery_end, ignore_passive_waiting=True
            ):
                continue

            alloc_w, alloc_v = self._calculate_allocation(
                mission, vehicle, available_weight, available_volume
            )
            if alloc_w <= 0 or alloc_v <= 0:
                continue

            # Opóźnianie wyjazdu (tylko dla stałego magazynu)
            if not origin_override:
                if arrival_at_origin >= wh_open:
                    ideal_start = wh_dest_open - approach_duration - transit_duration
                    if ideal_start >= possible_start and ideal_start >= earliest_start:
                        new_start = ideal_start
                        new_arrival = new_start + approach_duration
                        new_loading = max(new_arrival, wh_open)
                        if new_loading < wh_close:
                            new_delivery_arrival = new_loading + transit_duration
                            new_delivery_start = max(new_delivery_arrival, wh_dest_open)
                            new_delivery_end = new_delivery_start + unloading_time
                            if vehicle.is_available(
                                new_start, new_delivery_end, ignore_passive_waiting=True
                            ):
                                possible_start = new_start
                                arrival_at_origin = new_arrival
                                loading_start = new_loading
                                delivery_arrival = new_delivery_arrival
                                delivery_start = new_delivery_start
                                delivery_end = new_delivery_end
                else:
                    if wh_open + transit_duration >= wh_dest_open:
                        ideal_arrival = wh_open
                        ideal_start = ideal_arrival - approach_duration
                        if (
                            ideal_start >= possible_start
                            and ideal_start >= earliest_start
                        ):
                            new_start = ideal_start
                            new_arrival = new_start + approach_duration
                            new_loading = max(new_arrival, wh_open)
                            if new_loading < wh_close:
                                new_delivery_arrival = new_loading + transit_duration
                                new_delivery_start = max(
                                    new_delivery_arrival, wh_dest_open
                                )
                                new_delivery_end = new_delivery_start + unloading_time
                                if vehicle.is_available(
                                    new_start,
                                    new_delivery_end,
                                    ignore_passive_waiting=True,
                                ):
                                    possible_start = new_start
                                    arrival_at_origin = new_arrival
                                    loading_start = new_loading
                                    delivery_arrival = new_delivery_arrival
                                    delivery_start = new_delivery_start
                                    delivery_end = new_delivery_end

            passive_wait_before_load = timedelta(0)
            if arrival_at_origin < wh_open:
                passive_wait_before_load = wh_open - arrival_at_origin
                if (
                    passive_wait_before_load.total_seconds() / 3600
                    > self.max_passive_waiting_hours
                ):
                    continue

            active_wait = timedelta(0)
            if delivery_arrival < wh_dest_open:
                active_wait = wh_dest_open - delivery_arrival

            active_wait_hours = active_wait.total_seconds() / 3600.0
            passive_wait_hours = passive_wait_before_load.total_seconds() / 3600.0

            score = calculate_score(
                mission,
                vehicle,
                active_wait_hours=active_wait_hours,
                passive_wait_hours=passive_wait_hours,
            )

            if score > best_score:
                best_score = score
                assignment = MissionAssignment(mission, alloc_w, alloc_v)
                intervals = []

                if dist_to_origin > 0.1:
                    intervals.append(
                        TimeInterval(
                            possible_start,
                            arrival_at_origin,
                            Status.IN_PROGRESS_PASSIVE,
                            assignment,
                            cost=0.0,
                        )
                    )

                if arrival_at_origin < wh_open:
                    intervals.append(
                        TimeInterval(
                            arrival_at_origin,
                            wh_open,
                            Status.PASSIVE_WAITING,
                            assignment,
                            cost=0.0,
                        )
                    )

                intervals.append(
                    TimeInterval(
                        loading_start,
                        delivery_arrival,
                        Status.IN_PROGRESS_ACTIVE,
                        assignment,
                        cost=single_trip_cost,
                    )
                )

                if delivery_arrival < wh_dest_open:
                    intervals.append(
                        TimeInterval(
                            delivery_arrival,
                            wh_dest_open,
                            Status.ACTIVE_WAITING,
                            assignment,
                            cost=0.0,
                        )
                    )

                if delivery_start < delivery_end:
                    intervals.append(
                        TimeInterval(
                            delivery_start,
                            delivery_end,
                            Status.UNLOADING,
                            assignment,
                            cost=0.0,
                        )
                    )

                vehicle.timeSchedule = [
                    intv
                    for intv in vehicle.timeSchedule
                    if not (
                        intv.status == Status.PASSIVE_WAITING
                        and intv.mission_assignment is None
                    )
                ]

                best_result = (
                    best_score,
                    intervals,
                    single_trip_cost,
                    alloc_w,
                    alloc_v,
                )

        return best_result

    def _clean_expired_temp_warehouses(self, current_time: datetime):
        to_remove = []
        for tw in self.temp_warehouses:
            if current_time > tw.expiry:
                for mission_id, (w, v) in tw.assignments.items():
                    mission = next(
                        (m for m in self.missions if m.id == mission_id), None
                    )
                    if mission:
                        mission.remaining_weight += w
                        mission.remaining_volume += v
                        mission.stored_in_temp_weight -= w
                        mission.stored_in_temp_volume -= v
                to_remove.append(tw)
        for tw in to_remove:
            self.temp_warehouses.remove(tw)

    def _fill_gaps(self, vehicle: Vehicle):
        if not vehicle.timeSchedule:
            return
        sorted_iv = sorted(vehicle.timeSchedule, key=lambda x: x.start)
        new_intervals = []
        for i in range(len(sorted_iv) - 1):
            current_end = sorted_iv[i].end
            next_start = sorted_iv[i + 1].start
            if next_start > current_end:
                gap_interval = TimeInterval(
                    current_end,
                    next_start,
                    Status.PASSIVE_WAITING,
                    mission_assignment=None,
                    cost=0.0,
                )
                new_intervals.append(gap_interval)
        if new_intervals:
            vehicle.timeSchedule.extend(new_intervals)
            vehicle.timeSchedule.sort(key=lambda x: x.start)

    def create_initial_solution(self, start_date: datetime, end_date: datetime):
        current_date = start_date

        while current_date <= end_date:
            next_date = current_date + timedelta(days=1)
            self._clean_expired_temp_warehouses(current_date)

            # 1. Kursy z tymczasowych magazynów
            for mission in self.unassigned_missions[:]:
                if mission.stored_in_temp_weight > 0:
                    for tw in self.temp_warehouses:
                        if mission.id in tw.assignments:
                            w, v = tw.assignments[mission.id]
                            if w <= 0:
                                continue
                            temp_wh = tw.as_warehouse()
                            best_score = -float("inf")
                            best_vehicle = None
                            best_result = None
                            for vehicle in self.vehicles:
                                res = self._try_assign_vehicle_to_mission(
                                    vehicle,
                                    mission,
                                    current_date,
                                    self.calculate_remaining_budget(current_date),
                                    origin_override=temp_wh,
                                    available_weight=w,
                                    available_volume=v,
                                )
                                if res and res[0] > best_score:
                                    best_score = res[0]
                                    best_vehicle = vehicle
                                    best_result = res
                            if best_vehicle and best_result:
                                _, intervals, trip_cost, alloc_w, alloc_v = best_result
                                tw.assignments[mission.id] = (w - alloc_w, v - alloc_v)
                                mission.stored_in_temp_weight -= alloc_w
                                mission.stored_in_temp_volume -= alloc_v
                                if tw.assignments[mission.id][0] <= 0:
                                    del tw.assignments[mission.id]
                                if not tw.assignments:
                                    self.temp_warehouses.remove(tw)

                                mission.cost += trip_cost
                                if best_vehicle.id not in mission.assigned_vehicles:
                                    mission.assigned_vehicles.append(best_vehicle.id)
                                best_vehicle.add_intervals(intervals)
                                self._fill_gaps(best_vehicle)

                                if (
                                    mission.is_fully_assigned()
                                    and mission.stored_in_temp_weight <= 0
                                ):
                                    mission.mark_closed_if_complete()
                                    if mission.state == State.CLOSED:
                                        self.total_reward += mission.bonus
                                        if mission in self.unassigned_missions:
                                            self.unassigned_missions.remove(mission)

            # 2. Standardowe planowanie
            available_missions = [
                m
                for m in self.unassigned_missions
                if m.available_from < next_date
                and m.deadline >= current_date
                and m.state != State.CLOSED
                and not m.is_fully_assigned()
            ]
            available_missions.sort(key=lambda x: (-x.priority.value, x.deadline))

            assignments_made = True
            while assignments_made:
                assignments_made = False
                remaining_budget = self.calculate_remaining_budget(current_date)
                if remaining_budget <= 0:
                    break

                for mission in available_missions[:]:
                    if mission.is_fully_assigned():
                        mission.mark_closed_if_complete()
                        if mission.state == State.CLOSED:
                            self.total_reward += mission.bonus
                            if mission in available_missions:
                                available_missions.remove(mission)
                            if mission in self.unassigned_missions:
                                self.unassigned_missions.remove(mission)
                        continue

                    best_result = None
                    best_vehicle = None
                    best_score = -float("inf")

                    for vehicle in self.vehicles:
                        result = self._try_assign_vehicle_to_mission(
                            vehicle, mission, current_date, remaining_budget
                        )
                        if result and result[0] > best_score:
                            best_score = result[0]
                            best_result = result
                            best_vehicle = vehicle

                    if best_vehicle and best_result:
                        score, intervals, trip_cost, alloc_w, alloc_v = best_result

                        mission.remaining_weight -= alloc_w
                        mission.remaining_volume -= alloc_v
                        mission.cost += trip_cost

                        if mission.state == State.CREATED:
                            mission.state = State.IN_PROGRESS
                            num_trips = math.ceil(
                                max(
                                    mission.weight / best_vehicle.weight_capacity,
                                    mission.volume / best_vehicle.volume_capacity,
                                )
                            )
                            estimated_total = num_trips * (
                                best_vehicle.carrier.price_per_km
                                * mission.route_distance
                            )
                            mission.budget_commitment_date = current_date
                            mission.budget_commitment_amount = estimated_total

                        if best_vehicle.id not in mission.assigned_vehicles:
                            mission.assigned_vehicles.append(best_vehicle.id)

                        best_vehicle.add_intervals(intervals)
                        self._fill_gaps(best_vehicle)

                        mission.mark_closed_if_complete()
                        if mission.state == State.CLOSED:
                            self.total_reward += mission.bonus
                            if mission in available_missions:
                                available_missions.remove(mission)
                            if mission in self.unassigned_missions:
                                self.unassigned_missions.remove(mission)

                        assignments_made = True

            current_date = next_date

        for v in self.vehicles:
            self._fill_gaps(v)

    def destroy_worst_assignments(self, num_to_remove: int, simulation_time: datetime):
        assignment_info = {}
        for vehicle in self.vehicles:
            for interval in vehicle.timeSchedule:
                if interval.mission_assignment and interval.start >= simulation_time:
                    assignment = interval.mission_assignment
                    key = (assignment.mission.id, vehicle.id)
                    if key not in assignment_info:
                        assignment_info[key] = {
                            "assignment": assignment,
                            "vehicle": vehicle,
                            "active_wait_sec": 0.0,
                            "passive_wait_sec": 0.0,
                            "intervals": [],
                        }
                    if interval.status == Status.ACTIVE_WAITING:
                        assignment_info[key]["active_wait_sec"] += (
                            interval.end - interval.start
                        ).total_seconds()
                    elif interval.status == Status.PASSIVE_WAITING:
                        assignment_info[key]["passive_wait_sec"] += (
                            interval.end - interval.start
                        ).total_seconds()
                    if interval.status == Status.IN_PROGRESS_ACTIVE:
                        assignment_info[key]["intervals"].append(interval)

        if not assignment_info:
            return

        all_assignments = []
        for key, data in assignment_info.items():
            mission = data["assignment"].mission
            vehicle = data["vehicle"]
            active_hours = data["active_wait_sec"] / 3600.0
            passive_hours = data["passive_wait_sec"] / 3600.0
            score = calculate_score(
                mission,
                vehicle,
                active_wait_hours=active_hours,
                passive_wait_hours=passive_hours,
            )
            all_assignments.append(
                (score, data["assignment"], data["vehicle"], data["intervals"])
            )

        all_assignments.sort(key=lambda x: x[0])

        removed = 0
        for score, assignment, vehicle, intervals in all_assignments:
            if removed >= num_to_remove:
                break

            mission = assignment.mission
            vehicle.timeSchedule = [
                intv
                for intv in vehicle.timeSchedule
                if intv.mission_assignment != assignment
            ]
            if vehicle.id in mission.assigned_vehicles:
                mission.assigned_vehicles.remove(vehicle.id)

            mission.remaining_weight = min(
                mission.weight, mission.remaining_weight + assignment.allocated_weight
            )
            mission.remaining_volume = min(
                mission.volume, mission.remaining_volume + assignment.allocated_volume
            )
            mission.cost = max(
                0.0,
                mission.cost - sum(intv.cost for intv in intervals if intv.cost > 0),
            )

            if mission.remaining_weight >= mission.weight - 0.01:
                mission.state = State.CREATED
                mission.budget_commitment_date = None
                mission.budget_commitment_amount = 0.0
            else:
                mission.state = State.IN_PROGRESS

            if mission not in self.unassigned_missions:
                self.unassigned_missions.append(mission)

            removed += 1

        for v in self.vehicles:
            self._fill_gaps(v)

    def repair_greedy(self, start_date: datetime, end_date: datetime):
        self._rebuild_unassigned_list()
        self.create_initial_solution(start_date, end_date)

    def run_alns(
        self,
        iterations: int,
        start_date: datetime,
        end_date: datetime,
        simulation_time: datetime | None = None,
    ):
        sim_time = simulation_time or start_date
        self._rebuild_unassigned_list()
        self.create_initial_solution(start_date, end_date)

        for _ in range(iterations):
            num_to_remove = int(len(self.missions) * random.uniform(0.1, 0.25))
            num_to_remove = max(1, num_to_remove) if self.missions else 0

            if num_to_remove > 0:
                self.destroy_worst_assignments(num_to_remove, sim_time)
                self.repair_greedy(start_date, end_date)


def handle_vehicle_breakdown(
    vehicle: Vehicle,
    simulation_time: datetime,
    scheduler: DailyALNSScheduler,
    end_date: datetime,
):
    disruption_loc = vehicle.get_location_at_time(simulation_time)
    temp_wh = None

    intervals_to_remove = [
        iv for iv in vehicle.timeSchedule if iv.end > simulation_time
    ]
    for interval in intervals_to_remove:
        vehicle.timeSchedule.remove(interval)
        if interval.mission_assignment is None:
            continue
        assignment = interval.mission_assignment
        mission = assignment.mission

        if temp_wh is None:
            for tw in scheduler.temp_warehouses:
                if tw.location.distance(disruption_loc) < 0.001:
                    temp_wh = tw
                    break
            if temp_wh is None:
                temp_wh = TemporaryWarehouse(
                    id=f"TMP_{disruption_loc.latitude}_{disruption_loc.longitude}",
                    location=disruption_loc,
                    expiry=simulation_time + timedelta(days=1),
                )
                scheduler.temp_warehouses.append(temp_wh)

        if mission.id not in temp_wh.assignments:
            temp_wh.assignments[mission.id] = (0.0, 0.0)
        w, v = temp_wh.assignments[mission.id]
        temp_wh.assignments[mission.id] = (
            w + assignment.allocated_weight,
            v + assignment.allocated_volume,
        )

        mission.stored_in_temp_weight += assignment.allocated_weight
        mission.stored_in_temp_volume += assignment.allocated_volume

        if vehicle.id in mission.assigned_vehicles:
            mission.assigned_vehicles.remove(vehicle.id)

    vehicle.is_broken = True
    vehicle.disruption_location = disruption_loc

    scheduler._rebuild_unassigned_list()
    scheduler.run_alns(iterations=5, start_date=simulation_time, end_date=end_date)


def print_vehicle_working_hours(vehicle: Vehicle):
    print(f"\n{'='*60}")
    print(f"HARMONOGRAM PRACY POJAZDU: {vehicle.id}")
    print(f"{'='*60}")

    if not vehicle.timeSchedule:
        print("  -> Brak zaplanowanych zadań.")
        return

    sorted_intervals = sorted(vehicle.timeSchedule, key=lambda x: x.start)

    status_icons = {
        Status.IN_PROGRESS_ACTIVE: "🟢",
        Status.IN_PROGRESS_PASSIVE: "🔵",
        Status.ACTIVE_WAITING: "🟡",
        Status.PASSIVE_WAITING: "⚪",
        Status.UNLOADING: "🟠",
    }

    status_labels = {
        Status.IN_PROGRESS_ACTIVE: "JAZDA Z ŁADUNKIEM (DOSTAWA)",
        Status.IN_PROGRESS_PASSIVE: "JAZDA BEZ ŁADUNKU",
        Status.ACTIVE_WAITING: "OCZEKIWANIE Z ŁADUNKIEM",
        Status.PASSIVE_WAITING: "OCZEKIWANIE BEZ ŁADUNKU",
        Status.UNLOADING: "ROZŁADUNEK",
    }

    for interval in sorted_intervals:
        start_str = interval.start.strftime("%Y-%m-%d %H:%M")
        end_str = interval.end.strftime("%Y-%m-%d %H:%M")
        icon = status_icons.get(interval.status, "❓")
        label = status_labels.get(interval.status, str(interval.status))

        if interval.mission_assignment is None:
            print(f" [{start_str} -> {end_str}] {icon} {label}")
        else:
            m_id = interval.mission_assignment.mission.id
            w_val = interval.mission_assignment.allocated_weight
            cost_info = f" | Koszt: {interval.cost:.2f}zł" if interval.cost > 0 else ""
            print(f" [{start_str} -> {end_str}] {icon} {label}")
            print(f"   Misja: {m_id} | Waga: {w_val:.1f}kg{cost_info}")


def print_mission_summary(missions: list[Mission], total_reward: float = 0.0):
    print(f"\n{'='*60}")
    print("PODSUMOWANIE MISJI")
    print(f"{'='*60}")
    for m in missions:
        status_icon = (
            "✅"
            if m.state == State.CLOSED
            else "⏳" if m.state == State.IN_PROGRESS else "📋"
        )
        print(f"\n{status_icon} Misja {m.id}:")
        print(f"   Stan: {m.state.name}")
        print(
            f"   Waga: {m.weight}kg (pozostało: {m.remaining_weight:.1f}kg, w transporcie: {m.stored_in_temp_weight:.1f}kg)"
        )
        print(
            f"   Objętość: {m.volume}m³ (pozostało: {m.remaining_volume:.1f}m³, w transporcie: {m.stored_in_temp_volume:.1f}m³)"
        )
        print(f"   Koszt całkowity: {m.cost:.2f}zł")
        if m.bonus > 0:
            print(f"   Bonus za ukończenie: {m.bonus:.0f} pkt")
        print(
            f"   Przypisane pojazdy: {', '.join(m.assigned_vehicles) if m.assigned_vehicles else 'brak'}"
        )
    print(f"\nŁączna nagroda (punkty): {total_reward:.0f} pkt")


if __name__ == "__main__":
    budget = Budget(daily=30000.0, weekly=210000.0, monthly=900000.0)

    wh1 = Warehouses(
        "WH_START", Location(50.45, 30.52), time(4, 0), time(18, 0), True, 2.0
    )
    wh2 = Warehouses(
        "WH_KONIEC", Location(49.83, 24.02), time(18, 0), time(22, 0), True, 1.5
    )

    carrier = Carrier(
        "C01",
        Location(50.45, 30.52),
        price_per_km=2.0,
        reliability_score=90,
        public_verification_score=95.0,
        incident_score=0,
        operational_resilience=100,
    )

    v1 = Vehicle(
        "BUS_01",
        carrier,
        VehicleType.VAN,
        False,
        False,
        False,
        1.0,
        weight_capacity=50.0,
        volume_capacity=2.0,
    )
    v2 = Vehicle(
        "BUS_02",
        carrier,
        VehicleType.VAN,
        False,
        False,
        False,
        1.0,
        weight_capacity=40.0,
        volume_capacity=1.5,
    )

    m1 = Mission(
        "M001",
        wh1,
        wh2,
        Priority.HIGH,
        datetime.now(),
        datetime.now() + timedelta(days=3),
        weight=120.0,
        volume=4.0,
        route_distance=200.0,
        bonus=500.0,
    )
    m2 = Mission(
        "M002",
        wh1,
        wh2,
        Priority.MEDIUM,
        datetime.now(),
        datetime.now() + timedelta(days=3),
        weight=80.0,
        volume=3.0,
        route_distance=200.0,
        bonus=300.0,
    )
    m3 = Mission(
        "M003",
        wh1,
        wh2,
        Priority.LOW,
        datetime.now(),
        datetime.now() + timedelta(days=3),
        weight=60.0,
        volume=2.0,
        route_distance=200.0,
        bonus=200.0,
    )

    start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = start_date + timedelta(days=3)

    print("Uruchamianie schedulera ALNS...")
    print(f"Budżet dzienny: {budget.daily}zł")
    print(f"Zakres dat: {start_date.date()} - {end_date.date()}")

    scheduler = DailyALNSScheduler(
        vehicles=[v1, v2], missions=[m1, m2, m3], budget=budget
    )
    scheduler.run_alns(iterations=10, start_date=start_date, end_date=end_date)

    print_mission_summary([m1, m2, m3], scheduler.total_reward)

    print("\n" + "=" * 60)
    print("SZCZEGÓŁOWE HARMONOGRAMY POJAZDÓW")
    print("=" * 60)
    for v in [v1, v2]:
        print_vehicle_working_hours(v)

    print("\n" + "=" * 60)
    print("WYKORZYSTANIE BUDŻETU")
    print("=" * 60)
    current = start_date
    while current <= end_date:
        spent = scheduler.calculate_daily_spent(current)
        print(
            f"  {current.date()}: {spent:.2f}zł / {budget.daily:.2f}zł ({spent/budget.daily*100:.1f}%)"
        )
        current += timedelta(days=1)

    print("\n=== SYMULACJA AWARII ===")
    breakdown_time = start_date + timedelta(hours=5)
    handle_vehicle_breakdown(v1, breakdown_time, scheduler, end_date)

    print("\nPo awarii:")
    print_mission_summary([m1, m2, m3], scheduler.total_reward)
    for v in [v1, v2]:
        print_vehicle_working_hours(v)
