import { useCallback, useState } from "react";
import { getRecommendations } from "../api/recommendations";
import type { MissionProposition } from "../types";

type State = {
  data: MissionProposition[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
};

/**
 * Lazily fetches mission propositions (the call hits an LLM, so it's slow and
 * triggered on demand rather than on mount). Call `fetch` to (re)load.
 */
export function useRecommendations() {
  const [state, setState] = useState<State>({ data: [], loading: false, error: null, loaded: false });

  const fetch = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await getRecommendations();
      setState({ data, loading: false, error: null, loaded: true });
    } catch (err) {
      setState({ data: [], loading: false, error: (err as Error).message, loaded: true });
    }
  }, []);

  return { ...state, fetch };
}
