/**
 * Mission recommendations — asks the backend (which proxies an LLM service) to
 * propose missions from current warehouses + crisis demand points.
 */
import type { MissionProposition } from "../types";
import { api } from "../lib/api";

/** POST /api/v1/recommendations → list of proposed missions. */
export async function getRecommendations(): Promise<MissionProposition[]> {
  const res = await api.post<{ missions: MissionProposition[] }>("/recommendations", {});
  return res.missions ?? [];
}
