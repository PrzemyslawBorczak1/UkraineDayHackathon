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
