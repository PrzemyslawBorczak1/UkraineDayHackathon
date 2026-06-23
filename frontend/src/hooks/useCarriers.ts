import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { CarrierSummary } from "../types";

type State = {
  data: CarrierSummary[];
  loading: boolean;
  error: string | null;
};

/** Fetches the full carrier list — used to build a stable carrier→color map. */
export function useCarriers(): State {
  const [state, setState] = useState<State>({ data: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    api
      .get<CarrierSummary[]>("/carrier/")
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
