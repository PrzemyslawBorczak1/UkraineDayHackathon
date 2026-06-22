/**
 * Mission API client — talks to the FastAPI backend under /api/v1.
 *
 * The backend already returns the exact shapes the UI consumes (coords as
 * [lat, lng], ISO timestamps, per-vehicle routes), so these are thin pass-throughs.
 */
import type { MissionAnimation, MissionListItem } from "../types";
import { api } from "../lib/api";

/** List missions for the rail (lean shape used for filtering). */
export async function listMissions(): Promise<MissionListItem[]> {
  return api.get<MissionListItem[]>("/api/v1/missions?limit=60");
}

/** Full payloads (route + vehicles + window) for every mission on the timeline. */
export async function listMissionAnimations(): Promise<MissionAnimation[]> {
  return api.get<MissionAnimation[]>("/api/v1/missions/animations?limit=30");
}

/** Full animation payload for a single mission. */
export async function getMissionDetail(id: string): Promise<MissionAnimation> {
  return api.get<MissionAnimation>(`/api/v1/missions/${id}`);
}
