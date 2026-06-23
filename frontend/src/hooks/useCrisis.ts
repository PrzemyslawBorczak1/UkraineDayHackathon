import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { CrisisSummary } from "../types";

type State = {
  data: CrisisSummary[];
  loading: boolean;
  error: string | null;
};

/** Fetches the crisis-map objects (summary + coordinates). */
export function useCrisis(): State {
  const [state, setState] = useState<State>({ data: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    api
      .get<CrisisSummary[]>("/crisis/")
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
