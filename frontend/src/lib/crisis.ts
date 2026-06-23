import type { CrisisSummary } from "../types";

// Filterable crisis fields.
export type CrisisFacetKey = "severity" | "object_type" | "status";

export const CRISIS_FACETS: { key: CrisisFacetKey; label: string }[] = [
  { key: "severity", label: "Severity" },
  { key: "object_type", label: "Type" },
  { key: "status", label: "Status" },
];

const FACET_VALUE: Record<CrisisFacetKey, (c: CrisisSummary) => string> = {
  severity: (c) => c.severity,
  object_type: (c) => c.object_type,
  status: (c) => c.status,
};

export type CrisisFilters = Record<CrisisFacetKey, Set<string>>;

export const emptyCrisisFilters = (): CrisisFilters => ({
  severity: new Set(),
  object_type: new Set(),
  status: new Set(),
});

function passesFacet(c: CrisisSummary, facet: CrisisFacetKey, filters: CrisisFilters): boolean {
  const selected = filters[facet];
  return selected.size === 0 || selected.has(FACET_VALUE[facet](c));
}

/** Crisis objects passing every facet's selection. */
export function applyCrisisFilters(objects: CrisisSummary[], filters: CrisisFilters): CrisisSummary[] {
  return objects.filter((c) => CRISIS_FACETS.every(({ key }) => passesFacet(c, key, filters)));
}

/** Options for a facet given the *other* facets, so a chip never yields zero. */
export function crisisOptions(
  objects: CrisisSummary[],
  filters: CrisisFilters,
  facet: CrisisFacetKey
): string[] {
  const others = CRISIS_FACETS.map((f) => f.key).filter((k) => k !== facet);
  const values = new Set(filters[facet]);
  for (const c of objects) {
    if (others.every((k) => passesFacet(c, k, filters))) values.add(FACET_VALUE[facet](c));
  }
  return [...values].sort();
}

// ── Map presentation ─────────────────────────────────────────────────────────

// Red impact radius (metres) by severity — bigger = more severe.
const SEVERITY_RADIUS: Record<string, number> = {
  Critical: 38000,
  Medium: 22000,
  Operational: 12000,
};

export function crisisRadius(severity: string): number {
  return SEVERITY_RADIUS[severity] ?? 16000;
}

// Fill strength by severity (all red, just more intense when severe).
const SEVERITY_OPACITY: Record<string, number> = {
  Critical: 0.28,
  Medium: 0.18,
  Operational: 0.1,
};

export function crisisOpacity(severity: string): number {
  return SEVERITY_OPACITY[severity] ?? 0.15;
}
