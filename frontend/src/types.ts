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
