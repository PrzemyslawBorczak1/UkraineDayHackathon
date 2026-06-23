import type { MissionListItem } from "../types";

// Two filterable fields: carrier and cargo type.
export type MissionFacetKey = "carrier_id" | "cargo_type";
export type MissionFilters = Record<MissionFacetKey, Set<string>>;

export const emptyMissionFilters = (): MissionFilters => ({
  carrier_id: new Set(),
  cargo_type: new Set(),
});

function passesCarrier(m: MissionListItem, f: MissionFilters): boolean {
  return f.carrier_id.size === 0 || f.carrier_id.has(m.carrier_id);
}
function passesCargo(m: MissionListItem, f: MissionFilters): boolean {
  return f.cargo_type.size === 0 || f.cargo_type.has(m.cargo_type);
}

/** Missions passing both facets. */
export function applyMissionFilters(missions: MissionListItem[], f: MissionFilters): MissionListItem[] {
  return missions.filter((m) => passesCarrier(m, f) && passesCargo(m, f));
}

/** Carrier options (id + display name) valid given the cargo selection. */
export function carrierOptions(
  missions: MissionListItem[],
  f: MissionFilters
): { id: string; name: string }[] {
  const byId = new Map<string, string>();
  for (const m of missions) {
    if (passesCargo(m, f) || f.carrier_id.has(m.carrier_id)) byId.set(m.carrier_id, m.carrier_name);
  }
  return [...byId.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Cargo-type options valid given the carrier selection. */
export function cargoOptions(missions: MissionListItem[], f: MissionFilters): string[] {
  const values = new Set(f.cargo_type);
  for (const m of missions) {
    if (passesCarrier(m, f)) values.add(m.cargo_type);
  }
  return [...values].sort();
}
