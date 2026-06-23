/**
 * Mission API client — talks to the FastAPI backend under /api/v1.
 *
 * The backend returns the exact shapes the UI consumes (coords as [lat, lng],
 * ISO timestamps, per-vehicle routes from the seeded tasks), so these are thin
 * pass-throughs. The mock generator lives in ./mockMissions if ever needed.
 */
import type { MissionAnimation, MissionListItem } from "../types";
import { api } from "../lib/api";

/** List missions for the rail (lean shape used for filtering). */
export async function listMissions(): Promise<MissionListItem[]> {
  return api.get<MissionListItem[]>("/api/v1/missions?limit=200");
}

/** Full payloads (route + vehicles + window) for every mission on the timeline. */
export async function listMissionAnimations(): Promise<MissionAnimation[]> {
  return api.get<MissionAnimation[]>("/api/v1/missions/animations?limit=100");
}

/** Full animation payload for a single mission. */
export async function getMissionDetail(id: string): Promise<MissionAnimation> {
  return api.get<MissionAnimation>(`/api/v1/missions/${id}`);
}
