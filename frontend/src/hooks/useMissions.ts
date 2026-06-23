import { useEffect, useState } from "react";
import { listMissions } from "../api/missions";
import type { MissionListItem } from "../types";

type State = {
  data: MissionListItem[];
  loading: boolean;
  error: string | null;
};

/** Loads the mission list for the rail. */
export function useMissions(): State {
  const [state, setState] = useState<State>({ data: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    listMissions()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ data: [], loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
