import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { WarehouseDetail } from "../types";

type State = {
  data: WarehouseDetail | null;
  loading: boolean;
  error: string | null;
};

/** Fetches full detail for one warehouse; re-runs whenever `id` changes. */
export function useWarehouseDetail(id: string | null | undefined): State {
  const [state, setState] = useState<State>({ data: null, loading: false, error: null });

  useEffect(() => {
    if (!id) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState({ data: null, loading: true, error: null });
    api
      .get<WarehouseDetail>(`/warehouse/${id}/`)
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setState({ data: null, loading: false, error: err.message });
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return state;
}
