import { useState, useEffect, useRef } from "react";
import type { LatLng } from "../types";

// Module-level cache — survives re-renders and component unmounts
const routeCache = new Map<string, LatLng[]>();

function cacheKey(origin: LatLng, destination: LatLng): string {
  // OSRM expects lng,lat order
  return `${origin[1]},${origin[0]};${destination[1]},${destination[0]}`;
}

async function fetchOSRMRoute(origin: LatLng, destination: LatLng): Promise<LatLng[]> {
  const key = cacheKey(origin, destination);
  if (routeCache.has(key)) return routeCache.get(key)!;

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${key}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.code === "Ok" && data.routes?.[0]) {
      // OSRM returns [lng, lat]; Leaflet needs [lat, lng]
      const coords: LatLng[] = data.routes[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng] as LatLng
      );
      routeCache.set(key, coords);
      return coords;
    }
  } catch {
    // fall through to straight-line fallback
  }

  const fallback: LatLng[] = [origin, destination];
  routeCache.set(key, fallback);
  return fallback;
}

export type RouteRequest = {
  id: string;
  origin: LatLng;
  destination: LatLng;
};

/**
 * Fetches real road routes from the public OSRM API for each request.
 * Falls back to a straight line on error or while loading.
 * Results are cached at module level so re-mounting never re-fetches.
 */
export function useOSRMRoutes(requests: RouteRequest[]): Map<string, LatLng[]> {
  const [routes, setRoutes] = useState<Map<string, LatLng[]>>(new Map());
  const prevSig = useRef<string>("");

  useEffect(() => {
    const sig = requests
      .map((r) => `${r.id}:${cacheKey(r.origin, r.destination)}`)
      .join("|");
    if (sig === prevSig.current || requests.length === 0) return;
    prevSig.current = sig;

    Promise.all(
      requests.map(async (req) => {
        const route = await fetchOSRMRoute(req.origin, req.destination);
        return [req.id, route] as [string, LatLng[]];
      })
    ).then((entries) => setRoutes(new Map(entries)));
  }, [requests]);

  return routes;
}
