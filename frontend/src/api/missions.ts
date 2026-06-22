/**
 * Mission API client.
 *
 * Currently returns MOCK data after a simulated delay so the UI can be built
 * end-to-end before the backend exists. Each function has a commented-out real
 * call — swap the body for that once the endpoint is known and the shapes match.
 */
import type {
  LatLng,
  MissionAnimation,
  MissionListItem,
  MissionPath,
  MissionVehicleTrack,
} from "../types";
// import { api } from "../lib/api";

const CARRIERS: Record<string, string> = {
  C001: "RapidDelta Sp.j.",
  C002: "NordFracht Logistics",
  C003: "KresyTrans",
};

/** Builds N vehicle tracks from a base route, nudging each so they don't overlap. */
function vehiclesFor(
  missionId: string,
  carrierId: string,
  route: LatLng[],
  specs: string[]
): MissionVehicleTrack[] {
  const n = specs.length;
  return specs.map((vehicle_type, i) => {
    const shift = (i - (n - 1) / 2) * 0.035;
    return {
      id: `${missionId}-V${i + 1}`,
      vehicle_type,
      carrier_id: carrierId,
      route: route.map(([lat, lng]) => [lat + shift, lng + shift] as LatLng),
    };
  });
}

type Seed = {
  id: string;
  cargo_type: string;
  carrier_id: string;
  priority: string;
  status: string;
  origin_point: string;
  destination_point: string;
  route: LatLng[];
  start: string;
  end: string;
  specs: string[];
};

// Routes are rough Poland → Ukraine corridors; good enough for the demo.
const SEEDS: Seed[] = [
  {
    id: "M0001",
    cargo_type: "Medical supplies",
    carrier_id: "C001",
    priority: "Critical",
    status: "In transit",
    origin_point: "Kraków",
    destination_point: "Lviv",
    route: [[50.0647, 19.945], [49.9, 20.6], [49.7, 22.0], [49.8397, 24.0297]],
    start: "2026-06-23T06:00:00Z",
    end: "2026-06-23T18:00:00Z",
    specs: ["Refrigerated semi", "Van"],
  },
  {
    id: "M0002",
    cargo_type: "Fuel",
    carrier_id: "C002",
    priority: "High",
    status: "In transit",
    origin_point: "Warszawa",
    destination_point: "Kyiv",
    route: [[52.2297, 21.0122], [51.4, 22.2], [50.7, 23.9], [50.45, 30.5234]],
    start: "2026-06-23T04:00:00Z",
    end: "2026-06-24T10:00:00Z",
    specs: ["Standard semi", "Standard semi", "Rigid truck"],
  },
  {
    id: "M0003",
    cargo_type: "Food supplies",
    carrier_id: "C001",
    priority: "Medium",
    status: "Scheduled",
    origin_point: "Lublin",
    destination_point: "Przemyśl",
    route: [[51.2465, 22.5684], [50.5, 22.6], [49.7838, 22.7677]],
    start: "2026-06-23T08:00:00Z",
    end: "2026-06-23T15:00:00Z",
    specs: ["Rigid truck"],
  },
  {
    id: "M0004",
    cargo_type: "Generators",
    carrier_id: "C003",
    priority: "High",
    status: "Scheduled",
    origin_point: "Rzeszów",
    destination_point: "Lviv",
    route: [[50.0413, 21.999], [49.9, 22.6], [49.8397, 24.0297]],
    start: "2026-06-23T12:00:00Z",
    end: "2026-06-24T02:00:00Z",
    specs: ["BDF swap body", "Standard semi"],
  },
  {
    id: "M0005",
    cargo_type: "Medical supplies",
    carrier_id: "C002",
    priority: "Critical",
    status: "In transit",
    origin_point: "Gdańsk",
    destination_point: "Warszawa",
    route: [[54.352, 18.6466], [53.4, 19.2], [52.2297, 21.0122]],
    start: "2026-06-23T05:30:00Z",
    end: "2026-06-23T13:30:00Z",
    specs: ["Refrigerated semi", "Van"],
  },
  {
    id: "M0006",
    cargo_type: "Hygiene supplies",
    carrier_id: "C003",
    priority: "Low",
    status: "Scheduled",
    origin_point: "Poznań",
    destination_point: "Wrocław",
    route: [[52.4064, 16.9252], [51.8, 16.9], [51.1079, 17.0385]],
    start: "2026-06-23T09:00:00Z",
    end: "2026-06-23T14:00:00Z",
    specs: ["Van"],
  },
];

const DETAILS: Record<string, MissionAnimation> = Object.fromEntries(
  SEEDS.map((s) => {
    const detail: MissionAnimation = {
      id: s.id,
      cargo_type: s.cargo_type,
      carrier_id: s.carrier_id,
      carrier_name: CARRIERS[s.carrier_id] ?? s.carrier_id,
      origin_point: s.origin_point,
      destination_point: s.destination_point,
      origin: s.route[0],
      destination: s.route[s.route.length - 1],
      start: s.start,
      end: s.end,
      priority: s.priority,
      status: s.status,
      vehicles: vehiclesFor(s.id, s.carrier_id, s.route, s.specs),
    };
    return [s.id, detail];
  })
);

const PATHS: MissionPath[] = SEEDS.map((s) => ({
  id: s.id,
  carrier_id: s.carrier_id,
  route: s.route,
}));

const LIST: MissionListItem[] = SEEDS.map((s) => ({
  id: s.id,
  cargo_type: s.cargo_type,
  carrier_id: s.carrier_id,
  carrier_name: CARRIERS[s.carrier_id] ?? s.carrier_id,
  origin_point: s.origin_point,
  destination_point: s.destination_point,
  priority: s.priority,
  status: s.status,
}));

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** List missions for the rail. */
export async function listMissions(): Promise<MissionListItem[]> {
  // return api.get<MissionListItem[]>("/missions/");
  await delay(300);
  return LIST;
}

/** Every mission's overall path, for drawing all routes on the map at once. */
export async function listMissionPaths(): Promise<MissionPath[]> {
  // return api.get<MissionPath[]>("/missions/paths/");
  await delay(300);
  return PATHS;
}

/** Full payload for every mission, for the global timeline animation. */
export async function listMissionAnimations(): Promise<MissionAnimation[]> {
  // return api.get<MissionAnimation[]>("/missions/animations/");
  await delay(300);
  return Object.values(DETAILS);
}

/** Full mission payload (route + vehicles + time window) for the animation. */
export async function getMissionDetail(id: string): Promise<MissionAnimation> {
  // return api.get<MissionAnimation>(`/missions/${id}/`);
  await delay(300);
  const detail = DETAILS[id];
  if (!detail) throw new Error(`Mission ${id} not found`);
  return detail;
}
