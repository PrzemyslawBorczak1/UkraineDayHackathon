import { useEffect, useState } from "react";
import { listMissionAnimations } from "../api/missions";
import type { MissionAnimation } from "../types";

/** Loads full payloads (routes + vehicles + windows) for every mission. */
export function useMissionAnimations(): MissionAnimation[] {
  const [data, setData] = useState<MissionAnimation[]>([]);

  useEffect(() => {
    let cancelled = false;
    listMissionAnimations()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}
