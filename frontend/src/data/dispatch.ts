import type { MissionDetail, MissionResult, NavEntry } from "../types";

/**
 * Static placeholder content for the dispatch view. Swap these for real
 * queries later — the components only depend on the exported shapes, not on
 * where the data comes from.
 */

export const NAV_ENTRIES: NavEntry[] = [
  { id: "tasks", label: "Tasks", count: 240 },
  { id: "vehicles", label: "Carriers' Vehicles", count: 640 },
  { id: "warehouses", label: "Warehouses", count: 36 },
];

export const STATUS_FILTERS = ["queued", "transit", "delivered", "delayed"] as const;
export const PRIORITY_FILTERS = ["P1", "P2", "P3"] as const;
export const CARGO_FILTERS = ["medical", "food", "fuel", "shelter", "equipment"] as const;

export const MISSION_RESULTS: MissionResult[] = [
  { id: "MS-0001", tag: "EQUIPMENT", route: "Kraków Hub 1 → Lviv Hub 1" },
  { id: "MS-0002", tag: "FUEL", route: "Kraków Hub 3 → Kyiv Hub 1" },
  { id: "MS-0003", tag: "MEDICAL", route: "Lublin Hub 3 → Przemyśl Hub 2" },
  { id: "MS-0004", tag: "MEDICAL", route: "Rzeszów Hub 1 → Kyiv Hub 2" },
];

export const ACTIVE_MISSION: MissionDetail = {
  id: "MS-0001",
  status: "QUEUED",
  title: "Generators & tools",
  meta: "20.8t · equipment · priority P3",
  deadline: "T- 2d 3h",
  origin: "Kraków Hub 1",
  destination: "Lviv Hub 1",
  carrier: { name: "Baltic Translog", city: "Warszawa" },
  vehicles: [
    { id: "KV 1128B", kind: "Cargo Van", state: "maintenance" },
    { id: "KV 5655C", kind: "Tanker", state: "transit" },
  ],
};
