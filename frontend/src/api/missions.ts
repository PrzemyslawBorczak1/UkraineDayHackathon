/**
 * Mission API client.
 *
 * Currently returns MOCK data (100 generated missions, see ./mockMissions) so
 * the map has lots of routes to draw. To go back to the backend, swap each body
 * for the commented `api.get(...)` call.
 */
import type { MissionAnimation, MissionListItem } from "../types";
import { MOCK_MISSION_ANIMATIONS, MOCK_MISSION_LIST } from "./mockMissions";
// import { api } from "../lib/api";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** List missions for the rail (lean shape used for filtering). */
export async function listMissions(): Promise<MissionListItem[]> {
  // return api.get<MissionListItem[]>("/api/v1/missions?limit=60");
  await delay(200);
  return MOCK_MISSION_LIST;
}

/** Full payloads (route + vehicles + window) for every mission on the timeline. */
export async function listMissionAnimations(): Promise<MissionAnimation[]> {
  // return api.get<MissionAnimation[]>("/api/v1/missions/animations?limit=30");
  await delay(200);
  return MOCK_MISSION_ANIMATIONS;
}

/** Full animation payload for a single mission. */
export async function getMissionDetail(id: string): Promise<MissionAnimation> {
  // return api.get<MissionAnimation>(`/api/v1/missions/${id}`);
  await delay(200);
  const found = MOCK_MISSION_ANIMATIONS.find((m) => m.id === id);
  if (!found) throw new Error(`Mission ${id} not found`);
  return found;
}
