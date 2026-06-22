import type { ReactNode } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import type { LatLng } from "../../types";

// Center roughly between Poland and Ukraine — the KORD operating region.
const DEFAULT_CENTER: LatLng = [50.5, 25.0];
const DEFAULT_ZOOM = 6;

// CARTO light basemap keeps the map muted so overlays read clearly.
const TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

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
  children?: ReactNode;
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      zoomControl={false}
      className="h-full w-full bg-neutral-100"
    >
      <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
      {children}
    </MapContainer>
  );
}
