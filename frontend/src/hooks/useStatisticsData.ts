import { useEffect, useState } from "react";
import type { Mission, StatisticsData, Vehicle } from "../types";

/**
 * Mock data. Routes are loosely placed around Poland → Ukraine so the
 * map has something realistic to show. Replace the body of the effect
 * below with a real `fetch` once the backend endpoint exists.
 */
const MOCK_MISSIONS: Mission[] = [
  {
    id: "mission-1",
    trips: [
      {
        id: "trip-1a",
        polyline: [
          [52.2297, 21.0122], // Warsaw
          [51.4, 21.9],
          [51.2465, 22.5684], // Lublin
          [50.74, 23.9], // toward border
        ],
      },
      {
        id: "trip-1b",
        polyline: [
          [50.74, 23.9],
          [50.0, 25.3],
          [49.8397, 24.0297], // Lviv
        ],
      },
    ],
  },
  {
    id: "mission-2",
    trips: [
      {
        id: "trip-2a",
        polyline: [
          [50.0647, 19.945], // Krakow
          [49.9, 20.6],
          [49.6, 21.5],
          [49.0, 22.2], // toward border
        ],
      },
    ],
  },
  {
    id: "mission-3",
    trips: [
      {
        id: "trip-3a",
        polyline: [
          [54.352, 18.6466], // Gdansk
          [53.5, 19.1],
          [52.4064, 16.9252], // Poznan
        ],
      },
    ],
  },
];

const MOCK_VEHICLES: Vehicle[] = [
  {
    id: "veh-1",
    tripId: "trip-1a",
    lat: 51.2465,
    lng: 22.5684,
    carrierId: "carrier-alpha",
  },
  {
    id: "veh-2",
    tripId: "trip-1b",
    lat: 50.0,
    lng: 25.3,
    carrierId: "carrier-alpha",
  },
  {
    id: "veh-3",
    tripId: "trip-2a",
    lat: 49.6,
    lng: 21.5,
    carrierId: "carrier-beta",
  },
  {
    id: "veh-4",
    tripId: "trip-3a",
    lat: 53.5,
    lng: 19.1,
    carrierId: "carrier-gamma",
  },
];

type UseStatisticsData = StatisticsData & {
  loading: boolean;
  error: string | null;
};

/**
 * Fetches the data shown on the statistics map.
 *
 * Currently returns mock data after a short simulated delay. To wire it to
 * the real backend, replace the contents of the effect with a `fetch` that
 * resolves to a `StatisticsData` payload.
 */
export function useStatisticsData(): UseStatisticsData {
  const [data, setData] = useState<StatisticsData>({
    missions: [],
    vehicles: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // --- MOCK ---
    const timer = setTimeout(() => {
      if (cancelled) return;
      try {
        setData({ missions: MOCK_MISSIONS, vehicles: MOCK_VEHICLES });
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }, 400);

    // --- REAL (example) ---
    // fetch("http://localhost:8000/api/statistics")
    //   .then((res) => res.json())
    //   .then((payload: StatisticsData) => {
    //     if (!cancelled) {
    //       setData(payload);
    //       setLoading(false);
    //     }
    //   })
    //   .catch((err) => {
    //     if (!cancelled) {
    //       setError(String(err));
    //       setLoading(false);
    //     }
    //   });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return { ...data, loading, error };
}
