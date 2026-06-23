/**
 * Mock mission generator — produces ~100 missions with multi-point routes
 * (polylines) so the map has plenty to draw. Deterministic (seeded), so the
 * data is stable across reloads. Kept separate from the API client on purpose.
 */
import type { LatLng, MissionAnimation, MissionListItem, MissionVehicleTrack } from "../types";

const MISSION_COUNT = 100;

// Seeded PRNG (mulberry32) so the generated set never changes between reloads.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260623);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
const between = (lo: number, hi: number) => lo + rng() * (hi - lo);

// Hubs across Poland → western Ukraine; routes connect random pairs.
const CITIES: { name: string; coord: LatLng }[] = [
  { name: "Warszawa", coord: [52.2297, 21.0122] },
  { name: "Kraków", coord: [50.0647, 19.945] },
  { name: "Lublin", coord: [51.2465, 22.5684] },
  { name: "Rzeszów", coord: [50.0413, 21.999] },
  { name: "Przemyśl", coord: [49.7838, 22.7677] },
  { name: "Gdańsk", coord: [54.352, 18.6466] },
  { name: "Poznań", coord: [52.4064, 16.9252] },
  { name: "Wrocław", coord: [51.1079, 17.0385] },
  { name: "Katowice", coord: [50.2649, 19.0238] },
  { name: "Łódź", coord: [51.7592, 19.456] },
  { name: "Białystok", coord: [53.1325, 23.1688] },
  { name: "Kielce", coord: [50.8661, 20.6286] },
  { name: "Szczecin", coord: [53.4285, 14.5528] },
  { name: "Lwów (Lviv)", coord: [49.8397, 24.0297] },
  { name: "Łuck (Lutsk)", coord: [50.7472, 25.3254] },
  { name: "Tarnopol", coord: [49.5535, 25.5948] },
  { name: "Użhorod", coord: [48.6208, 22.2879] },
  { name: "Kijów (Kyiv)", coord: [50.4501, 30.5234] },
];

const CARRIERS: { id: string; name: string }[] = [
  { id: "C001", name: "RapidDelta Sp.j." },
  { id: "C002", name: "NordFracht Logistics" },
  { id: "C003", name: "KresyTrans" },
  { id: "C004", name: "Wisła Cargo" },
  { id: "C005", name: "Karpaty Logistik" },
  { id: "C006", name: "BałtykExpress" },
  { id: "C007", name: "Odra Freight" },
  { id: "C008", name: "Sarmat Transport" },
];

const CARGO_TYPES = [
  "Medical supplies",
  "Medical equipment",
  "Food supplies",
  "Drinking water",
  "Fuel",
  "Generators",
  "Hygiene supplies",
  "Field beds",
  "Camp equipment",
  "Rescue equipment",
] as const;

const VEHICLE_TYPES = ["Standard semi", "Refrigerated semi", "Rigid truck", "BDF swap body", "Van"] as const;
const PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;
const STATUSES = ["Scheduled", "In transit", "Delayed"] as const;

/** Builds a curved polyline between two points with jittered interior waypoints. */
function buildRoute(a: LatLng, b: LatLng, segments: number, jitter: number): LatLng[] {
  const pts: LatLng[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    let lat = a[0] + (b[0] - a[0]) * t;
    let lng = a[1] + (b[1] - a[1]) * t;
    if (i !== 0 && i !== segments) {
      lat += (rng() - 0.5) * jitter;
      lng += (rng() - 0.5) * jitter;
    }
    pts.push([lat, lng]);
  }
  return pts;
}

function offsetRoute(route: LatLng[], shift: number): LatLng[] {
  return route.map(([lat, lng]) => [lat + shift, lng + shift] as LatLng);
}

// Global window: a 2-day span; each mission sits somewhere inside it.
const WINDOW_START = Date.parse("2026-06-23T00:00:00Z");
const HOUR = 3600 * 1000;

function generate(): { animations: MissionAnimation[]; list: MissionListItem[] } {
  const animations: MissionAnimation[] = [];

  for (let i = 0; i < MISSION_COUNT; i++) {
    const id = `M${String(i + 1).padStart(4, "0")}`;
    let from = pick(CITIES);
    let to = pick(CITIES);
    while (to.name === from.name) to = pick(CITIES);

    const carrier = pick(CARRIERS);
    const cargo_type = pick(CARGO_TYPES);
    const priority = pick(PRIORITIES);
    const status = pick(STATUSES);

    const route = buildRoute(from.coord, to.coord, 3 + Math.floor(rng() * 3), 0.45);

    const startMs = WINDOW_START + between(0, 34) * HOUR;
    const endMs = startMs + between(4, 16) * HOUR;

    const vehicleCount = 1 + Math.floor(rng() * 3);
    const vehicles: MissionVehicleTrack[] = Array.from({ length: vehicleCount }, (_, v) => ({
      id: `${id}-V${v + 1}`,
      vehicle_type: pick(VEHICLE_TYPES),
      carrier_id: carrier.id,
      route: offsetRoute(route, (v - (vehicleCount - 1) / 2) * 0.03),
    }));

    animations.push({
      id,
      cargo_type,
      carrier_id: carrier.id,
      carrier_name: carrier.name,
      origin_point: from.name,
      destination_point: to.name,
      origin: route[0],
      destination: route[route.length - 1],
      start: new Date(startMs).toISOString(),
      end: new Date(endMs).toISOString(),
      priority,
      status,
      vehicles,
    });
  }

  const list: MissionListItem[] = animations.map((a) => ({
    id: a.id,
    cargo_type: a.cargo_type,
    carrier_id: a.carrier_id,
    carrier_name: a.carrier_name,
    origin_point: a.origin_point,
    destination_point: a.destination_point,
    priority: a.priority,
    status: a.status,
  }));

  return { animations, list };
}

const generated = generate();

export const MOCK_MISSION_ANIMATIONS: MissionAnimation[] = generated.animations;
export const MOCK_MISSION_LIST: MissionListItem[] = generated.list;
