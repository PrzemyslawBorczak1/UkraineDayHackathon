import type { WarehouseSummary } from "../types";

// ── Facets (the filterable warehouse fields) ───────────────────────────────

export type FacetKey = "voivodeship" | "warehouse_type" | "availability_status" | "cold_storage";

/** Order + labels of the facets shown in the sidebar. */
export const FACETS: { key: FacetKey; label: string }[] = [
  { key: "voivodeship", label: "Region" },
  { key: "warehouse_type", label: "Type" },
  { key: "availability_status", label: "Availability" },
  { key: "cold_storage", label: "Storage" },
];

/** Maps a warehouse to its display value for a given facet. */
const FACET_VALUE: Record<FacetKey, (w: WarehouseSummary) => string> = {
  voivodeship: (w) => w.voivodeship,
  warehouse_type: (w) => w.warehouse_type,
  availability_status: (w) => w.availability_status,
  cold_storage: (w) => (w.cold_storage ? "Cold storage" : "Ambient"),
};

export type WarehouseFilters = Record<FacetKey, Set<string>>;

export const emptyFilters = (): WarehouseFilters => ({
  voivodeship: new Set(),
  warehouse_type: new Set(),
  availability_status: new Set(),
  cold_storage: new Set(),
});

/** True when `w` passes the selected values of `facet` (empty selection = pass). */
function passesFacet(w: WarehouseSummary, facet: FacetKey, filters: WarehouseFilters): boolean {
  const selected = filters[facet];
  return selected.size === 0 || selected.has(FACET_VALUE[facet](w));
}

/** Warehouses passing every facet's selection. */
export function applyFilters(warehouses: WarehouseSummary[], filters: WarehouseFilters): WarehouseSummary[] {
  return warehouses.filter((w) => FACETS.every(({ key }) => passesFacet(w, key, filters)));
}

/**
 * Options to render for `facet`: the distinct values present among warehouses
 * that pass every *other* facet — so a chip never yields zero results. Any
 * value already selected on this facet is kept so it stays deselectable.
 */
export function availableOptions(
  warehouses: WarehouseSummary[],
  filters: WarehouseFilters,
  facet: FacetKey
): string[] {
  const others = FACETS.map((f) => f.key).filter((k) => k !== facet);
  const values = new Set(filters[facet]);
  for (const w of warehouses) {
    if (others.every((k) => passesFacet(w, k, filters))) values.add(FACET_VALUE[facet](w));
  }
  return [...values].sort();
}

// ── Carrier colors ─────────────────────────────────────────────────────────

// Distinct, readable hues for warehouse markers grouped by carrier.
const PALETTE = [
  "#6366f1", "#10b981", "#ef4444", "#f59e0b", "#0ea5e9",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#84cc16",
  "#06b6d4", "#a855f7", "#e11d48", "#22c55e", "#eab308",
];

/** Stable carrier-id → color map (palette wraps for large fleets). */
export function buildCarrierColors(warehouses: WarehouseSummary[]): Map<string, string> {
  const ids = [...new Set(warehouses.map((w) => w.carrier_id))].sort();
  return new Map(ids.map((id, i) => [id, PALETTE[i % PALETTE.length]]));
}
