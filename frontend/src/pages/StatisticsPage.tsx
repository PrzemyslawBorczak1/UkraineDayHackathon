import { renderToStaticMarkup } from "react-dom/server";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { TruckIcon } from "../components/TruckIcon";
import { useStatisticsData } from "../hooks/useStatisticsData";
import type { LatLng } from "../types";

// Distinct colors per mission so routes are easy to tell apart.
const MISSION_COLORS = ["#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed"];

// Palette used to color vehicles by carrier.
const CARRIER_COLORS = ["#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed", "#0891b2"];

// Center roughly between Poland and Ukraine.
const DEFAULT_CENTER: LatLng = [51.0, 22.0];
const DEFAULT_ZOOM = 6;

const TRUCK_SIZE = 24;

/** Stable color for a carrier id, derived from a simple string hash. */
function carrierColor(carrierId: string): string {
  let hash = 0;
  for (let i = 0; i < carrierId.length; i++) {
    hash = (hash * 31 + carrierId.charCodeAt(i)) | 0;
  }
  return CARRIER_COLORS[Math.abs(hash) % CARRIER_COLORS.length];
}

/** Builds a Leaflet divIcon from the TruckIcon SVG, tinted per carrier. */
function makeTruckIcon(color: string): L.DivIcon {
  const html = renderToStaticMarkup(<TruckIcon color={color} size={TRUCK_SIZE} />);
  return L.divIcon({
    html,
    className: "truck-marker",
    iconSize: [TRUCK_SIZE, TRUCK_SIZE],
    iconAnchor: [TRUCK_SIZE / 2, TRUCK_SIZE / 2],
    popupAnchor: [0, -TRUCK_SIZE / 2],
  });
}

export function StatisticsPage() {
  const { missions, vehicles, loading, error } = useStatisticsData();

  return (
    <div style={{ height: "100vh", width: "100vw", position: "relative" }}>
      {(loading || error) && (
        <div
          style={{
            position: "absolute",
            top: 10,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1000,
            background: error ? "#fee2e2" : "#fff",
            padding: "4px 10px",
            borderRadius: 6,
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
            fontFamily: "sans-serif",
            fontSize: 12,
          }}
        >
          {error ? `Error: ${error}` : "Loading map data…"}
        </div>
      )}

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Mission routes (dashed polylines per trip) */}
        {missions.map((mission, i) => {
          const color = MISSION_COLORS[i % MISSION_COLORS.length];
          return mission.trips.map((trip) => (
            <Polyline
              key={trip.id}
              positions={trip.polyline}
              pathOptions={{
                color,
                weight: 2.5,
                opacity: 0.8,
                dashArray: "8 8",
              }}
            >
              <Popup>
                Mission: {mission.id}
                <br />
                Trip: {trip.id}
              </Popup>
            </Polyline>
          ));
        })}

        {/* Vehicles (colored by carrier) */}
        {vehicles.map((vehicle) => (
          <Marker
            key={vehicle.id}
            position={[vehicle.lat, vehicle.lng]}
            icon={makeTruckIcon(carrierColor(vehicle.carrierId))}
          >
            <Popup>
              Vehicle: {vehicle.id}
              <br />
              Carrier: {vehicle.carrierId}
              <br />
              Trip: {vehicle.tripId}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
