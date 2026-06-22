import { MapContainer, TileLayer } from "react-leaflet";
import type { LatLng } from "../../types";

// Center roughly between Poland and Ukraine — the KORD operating region.
const DEFAULT_CENTER: LatLng = [50.5, 25.0];
const DEFAULT_ZOOM = 6;

/**
 * The central map stage. Fills its parent and renders an OSM base layer.
 * Overlays (routes, vehicle markers) will be layered in as children later —
 * for now it is intentionally empty so the page is just the styled shell.
 */
export function MissionMap({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  children,
}: {
  center?: LatLng;
  zoom?: number;
  children?: React.ReactNode;
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      zoomControl={false}
      className="h-full w-full"
      style={{ background: "#f5f5f5" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {children}
    </MapContainer>
  );
}
