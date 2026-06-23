/** A single [latitude, longitude] coordinate pair. */
export type LatLng = [number, number];

/** A trip is one leg of a mission, drawn on the map as a polyline. */
export type Trip = {
  id: string;
  /** Ordered list of points that make up the route line. */
  polyline: LatLng[];
};

/** A mission groups one or more trips together. */
export type Mission = {
  id: string;
  trips: Trip[];
};

/** A vehicle currently positioned somewhere along a trip. */
export type Vehicle = {
  id: string;
  /** The trip this vehicle is currently driving. */
  tripId: string;
  lat: number;
  lng: number;
  /** Carrier (operator) the vehicle belongs to. */
  carrierId: string;
};

/** Shape returned by the statistics data hook. */
export type StatisticsData = {
  missions: Mission[];
  vehicles: Vehicle[];
};

// --- Dispatch UI domain ----------------------------------------------------

/** A left-rail navigation entry with a live count. */
export type NavEntry = {
  id: string;
  label: string;
  count: number;
};

/** A row in the mission results list. */
export type MissionResult = {
  id: string;
  tag: string;
  route: string;
};

/** Operational state of a vehicle, used to pick a status badge tone. */
export type VehicleState = "queued" | "transit" | "delivered" | "maintenance";

/** A vehicle assigned to a mission. */
export type VehicleAssignment = {
  id: string;
  kind: string;
  state: VehicleState;
};

/** The full mission detail shown in the right rail. */
export type MissionDetail = {
  id: string;
  status: string;
  title: string;
  meta: string;
  deadline: string;
  origin: string;
  destination: string;
  carrier: { name: string; city: string };
  vehicles: VehicleAssignment[];
};

/** A start/end time window the dispatcher is looking at. */
export type TimeWindow = {
  start: Date;
  end: Date;
};

// --- Carriers --------------------------------------------------------------

/** Lean carrier shape returned by GET /carrier/ (summary + coordinates). */
export type CarrierSummary = {
  id: string;
  name: string;
  hq_city: string;
  voivodeship: string;
  operating_region: string;
  activity_type: string;
  declared_fleet_size: number;
  reliability_score: number;
  risk_rating: string;
  crisis_participation_status: string;
  lat: number;
  lng: number;
};

// --- Warehouses ------------------------------------------------------------

/** Lean warehouse shape returned by GET /warehouse/ (summary + coordinates). */
export type WarehouseSummary = {
  id: string;
  carrier_id: string;
  name: string;
  city: string;
  voivodeship: string;
  warehouse_type: string;
  cold_storage: boolean;
  available_capacity_pct: number;
  availability_status: string;
  lat: number;
  lng: number;
};

// --- Missions (list + animated playback) -----------------------------------

/** Row in the mission list — the lean shape used for the rail + filtering. */
export type MissionListItem = {
  id: string;
  cargo_type: string;
  carrier_id: string;
  carrier_name: string;
  origin_point: string;
  destination_point: string;
  priority: string;
  status: string;
};

/** A mission's overall path (origin → destination polyline), for the map overlay. */
export type MissionPath = {
  id: string;
  carrier_id: string;
  route: LatLng[];
};

/** One vehicle on a mission, with the route polyline it drives. */
export type MissionVehicleTrack = {
  id: string;
  vehicle_type: string;
  carrier_id: string;
  /** Ordered [lat, lng] points making up the driven path. */
  route: LatLng[];
};

/**
 * Full mission payload used to drive the map animation. Every vehicle advances
 * at the same normalized rate between `start` and `end`, so a single timeline
 * cursor positions all of them at once.
 */
export type MissionAnimation = {
  id: string;
  cargo_type: string;
  carrier_id: string;
  carrier_name: string;
  origin_point: string;
  destination_point: string;
  origin: LatLng;
  destination: LatLng;
  /** ISO 8601 — when the mission departs. */
  start: string;
  /** ISO 8601 — when the mission is due / arrives. */
  end: string;
  priority: string;
  status: string;
  vehicles: MissionVehicleTrack[];
};

// --- Mission propositions (LLM recommendations) ----------------------------

/** One recommended mission returned by POST /api/v1/recommendations. */
export type MissionProposition = {
  origin_id: string;       // Warehouse ID
  destination_id: string;  // Crisis-map object ID
  proposed_cargo_type: string;
  required_vehicle_type: string;
  priority: string;
  estimated_distance_km: number;
  justification: string;
};

/** A proposition enriched with resolved origin/destination display names. */
export type MissionPropositionView = {
  proposition: MissionProposition;
  originName: string;
  destName: string;
};

/** Prefill passed into the New Mission form when a proposition is chosen. */
export type MissionPrefill = {
  cargo_type?: string;
  origin_warehouse_id?: string;
  destination_point?: string;
  dest_lat?: string;
  dest_lng?: string;
  route_distance_km?: string;
  required_vehicle_type?: string;
  priority?: string;
  special_requirement?: string;
};

// --- Crisis map ------------------------------------------------------------

/** Lean crisis-map object returned by GET /crisis/ (summary + coordinates). */
export type CrisisSummary = {
  id: string;
  object_type: string;
  name: string;
  city: string;
  voivodeship: string;
  severity: string;
  status: string;
  lat: number;
  lng: number;
};

/** Full warehouse record returned by GET /warehouse/{id}/. */
export type WarehouseDetail = {
  id: string;
  carrier_id: string;
  name: string;
  city: string;
  voivodeship: string;
  geom: { lat: number; lng: number };
  warehouse_type: string;
  area_m2: number;
  dock_doors: number;
  cold_storage: boolean;
  on_site_security: boolean;
  operating_hours: string;
  available_capacity_pct: number;
  availability_status: string;
  activation_time_hours: number;
};
