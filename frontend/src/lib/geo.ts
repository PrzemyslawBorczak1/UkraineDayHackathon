import type { LatLng } from "../types";

/** Linear interpolation between two numbers. */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Position along a polyline at normalized progress `t` (0 = start, 1 = end),
 * measured by cumulative segment length so movement looks even. Lat/lng are
 * treated as a flat plane — fine for the short corridors shown here.
 */
export function pointAlongRoute(route: LatLng[], t: number): LatLng {
  if (route.length === 0) return [0, 0];
  if (route.length === 1) return route[0];

  const clamped = Math.min(1, Math.max(0, t));
  const segLens: number[] = [];
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const d = Math.hypot(route[i + 1][0] - route[i][0], route[i + 1][1] - route[i][1]);
    segLens.push(d);
    total += d;
  }
  if (total === 0) return route[0];

  let dist = clamped * total;
  for (let i = 0; i < segLens.length; i++) {
    if (dist <= segLens[i]) {
      const f = segLens[i] === 0 ? 0 : dist / segLens[i];
      return [lerp(route[i][0], route[i + 1][0], f), lerp(route[i][1], route[i + 1][1], f)];
    }
    dist -= segLens[i];
  }
  return route[route.length - 1];
}

/** Normalized progress (0..1) of `cursorMs` within the [startMs, endMs] window. */
export function progressOf(startMs: number, endMs: number, cursorMs: number): number {
  if (endMs <= startMs) return 0;
  return Math.min(1, Math.max(0, (cursorMs - startMs) / (endMs - startMs)));
}
