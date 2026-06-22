import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { WarehouseSummary } from "../types";

type State = {
  data: WarehouseSummary[];
  loading: boolean;
  error: string | null;
};

/** Fetches the warehouse list (summary fields + coordinates) from the backend. */
export function useWarehouses(): State {
  const [state, setState] = useState<State>({ data: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    api
      .get<WarehouseSummary[]>("/warehouse/")
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
