import { useMemo, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { TruckIcon } from "../components/TruckIcon";
import { useStatisticsData } from "../hooks/useStatisticsData";
import type { LatLng } from "../types";

// Palette used to color vehicles by carrier.
const CARRIER_COLORS = ["#2563eb", "#dc2626", "#16a34a", "#d97706", "#7c3aed", "#0891b2"];

// Neutral color for all mission routes.
const MISSION_COLOR = "#6b7280";

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

  // Carriers present in the data.
  const carrierIds = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.carrierId))).sort(),
    [vehicles]
  );

  // Which carriers are currently shown. `null` means "all" (default).
  const [selected, setSelected] = useState<Set<string> | null>(null);

  const isSelected = (carrierId: string) =>
    selected === null || selected.has(carrierId);

  const toggleCarrier = (carrierId: string) => {
    setSelected((prev) => {
      // Start from the full set if we were showing everything.
      const next = new Set(prev ?? carrierIds);
      if (next.has(carrierId)) {
        next.delete(carrierId);
      } else {
        next.add(carrierId);
      }
      return next;
    });
  };

  const visibleVehicles = vehicles.filter((v) => isSelected(v.carrierId));

  // A trip belongs to whichever carrier's vehicle drives it. Only trips
  // driven by a visible carrier should be shown.
  const visibleTripIds = useMemo(
    () => new Set(visibleVehicles.map((v) => v.tripId)),
    [visibleVehicles]
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ flex: 1, position: "relative", minHeight: 0, padding: 16 }}>
        {(loading || error) && (
          <div
            style={{
              position: "absolute",
              top: 26,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1000,
              background: error ? "#fee2e2" : "#fff",
              padding: "4px 10px",
              borderRadius: 6,
              boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
              fontSize: 12,
            }}
          >
            {error ? `Error: ${error}` : "Loading map data…"}
          </div>
        )}

        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{
            height: "100%",
            width: "100%",
            borderRadius: 8,
            boxShadow: "0 1px 6px rgba(0,0,0,0.15)",
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Mission routes (dashed, neutral color) — only for selected carriers */}
          {missions.map((mission) =>
            mission.trips
              .filter((trip) => visibleTripIds.has(trip.id))
              .map((trip) => (
              <Polyline
                key={trip.id}
                positions={trip.polyline}
                pathOptions={{
                  color: MISSION_COLOR,
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
            ))
          )}

          {/* Vehicles (colored by carrier, filtered) */}
          {visibleVehicles.map((vehicle) => (
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

      {/* Carrier filter bar */}
      <div
        style={{
          flexShrink: 0,
          padding: "12px 16px",
          borderTop: "1px solid #e5e7eb",
          background: "#f9fafb",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
          Carriers:
        </span>

        <button
          type="button"
          onClick={() => setSelected(null)}
          style={{
            fontSize: 12,
            padding: "4px 10px",
            borderRadius: 999,
            border: "1px solid #d1d5db",
            background: selected === null ? "#111827" : "#fff",
            color: selected === null ? "#fff" : "#374151",
            cursor: "pointer",
          }}
        >
          All
        </button>

        {carrierIds.map((carrierId) => {
          const active = isSelected(carrierId);
          const color = carrierColor(carrierId);
          return (
            <button
              key={carrierId}
              type="button"
              onClick={() => toggleCarrier(carrierId)}
              style={{
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: 999,
                border: `1px solid ${color}`,
                background: active ? color : "#fff",
                color: active ? "#fff" : color,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                opacity: active ? 1 : 0.6,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: color,
                  border: active ? "1px solid #fff" : "none",
                }}
              />
              {carrierId}
            </button>
          );
        })}
      </div>
    </div>
  );
}
