import { useState } from "react";
import { api } from "../lib/api";

/** Fields sent to POST /api/v1/missions — matches MissionCreate on the backend. */
export type MissionCreatePayload = {
  cargo_type: string;
  origin_point: string;
  origin_lat: number;
  origin_lng: number;
  destination_point: string;
  dest_lat: number;
  dest_lng: number;
  route_distance_km: number;
  weight_t: number;
  volume_m3: number;
  required_vehicle_type: string;
  priority: string;
  available_from: string; // ISO 8601
  deadline: string;       // ISO 8601
  estimated_cost: number;
  requesting_authority: string;
  special_requirement?: string;
};

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; id: string }
  | { status: "error"; message: string };

export function useCreateMission() {
  const [state, setState] = useState<State>({ status: "idle" });

  const create = async (payload: MissionCreatePayload) => {
    setState({ status: "loading" });
    try {
      const result = await api.post<{ id: string }>("/missions", payload);
      setState({ status: "success", id: result.id });
    } catch (err) {
      setState({ status: "error", message: (err as Error).message });
    }
  };

  const reset = () => setState({ status: "idle" });

  return { state, create, reset };
}
