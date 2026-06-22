import { memo, useState } from "react";
import { Chip, Input, NavItem, SectionLabel, cx } from "../ui";
import {
  CARGO_FILTERS,
  MISSION_RESULTS,
  NAV_ENTRIES,
  PRIORITY_FILTERS,
  STATUS_FILTERS,
} from "../../data/dispatch";
import type { MissionResult, WarehouseSummary } from "../../types";
import {
  FACETS,
  availableOptions,
  type FacetKey,
  type WarehouseFilters,
} from "../../lib/warehouses";

/** A filter-group block: label + a wrapping row of toggle chips. */
const FilterGroup = memo(function FilterGroup({
  label,
  options,
}: {
  label: string;
  options: readonly string[];
}) {
  const [on, setOn] = useState<Set<string>>(() => new Set());
  const toggle = (v: string) =>
    setOn((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });

  return (
    <div className="space-y-2">
      <SectionLabel>{label}</SectionLabel>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <Chip key={o} on={on.has(o)} onClick={() => toggle(o)}>
            {o}
          </Chip>
        ))}
      </div>
    </div>
  );
});

/** A single mission row in the results list. */
const ResultCard = memo(function ResultCard({
  result,
  active,
  onClick,
}: {
  result: MissionResult;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "w-full text-left rounded-lg px-4 py-3 transition-colors",
        active ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold tabular-nums">{result.id}</span>
        <span
          className={cx(
            "text-[10px] tracking-widest",
            active ? "text-white/60" : "text-neutral-400"
          )}
        >
          {result.tag}
        </span>
      </div>
      <div className={cx("mt-1 text-[11px]", active ? "text-white/70" : "text-neutral-500")}>
        {result.route}
      </div>
    </button>
  );
});

/** A warehouse row, with a carrier-colored dot matching its map marker. */
const WarehouseCard = memo(function WarehouseCard({
  warehouse,
  color,
  active,
  onClick,
}: {
  warehouse: WarehouseSummary;
  color: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "w-full text-left rounded-lg px-4 py-3 transition-colors",
        active ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 min-w-0">
          <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} />
          <span className="text-sm font-semibold truncate">{warehouse.name}</span>
        </span>
        <span
          className={cx(
            "text-[10px] tabular-nums shrink-0",
            active ? "text-white/60" : "text-neutral-400"
          )}
        >
          {warehouse.available_capacity_pct}%
        </span>
      </div>
      <div className={cx("mt-1 text-[11px] truncate", active ? "text-white/70" : "text-neutral-500")}>
        {warehouse.city} · {warehouse.voivodeship} · {warehouse.warehouse_type}
      </div>
    </button>
  );
});

/** Warehouse facet filters — each chip row only shows values that still match. */
function WarehouseFilterPanel({
  warehouses,
  filters,
  onToggle,
}: {
  warehouses: WarehouseSummary[];
  filters: WarehouseFilters;
  onToggle: (facet: FacetKey, value: string) => void;
}) {
  return (
    <>
      {FACETS.filter(({ key }) => key !== "voivodeship").map(({ key, label }) => {
        const options = availableOptions(warehouses, filters, key);
        if (options.length === 0) return null;
        return (
          <div key={key} className="space-y-2">
            <SectionLabel>{label}</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {options.map((o) => (
                <Chip key={o} on={filters[key].has(o)} onClick={() => onToggle(key, o)}>
                  {o}
                </Chip>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

type LeftSidebarProps = {
  activeNav: string | undefined;
  onNavChange: (id: string) => void;
  warehouses: WarehouseSummary[];
  warehousesLoading: boolean;
  warehousesError: string | null;
  filters: WarehouseFilters;
  onToggleFilter: (facet: FacetKey, value: string) => void;
  filteredWarehouses: WarehouseSummary[];
  carrierColors: Map<string, string>;
  selectedWarehouseId: string | null;
  onSelectWarehouse: (id: string) => void;
};

/** Left rail: brand, navigation, search and the per-view filters + results. */
export function LeftSidebar({
  activeNav,
  onNavChange,
  warehouses,
  warehousesLoading,
  warehousesError,
  filters,
  onToggleFilter,
  filteredWarehouses,
  carrierColors,
  selectedWarehouseId,
  onSelectWarehouse,
}: LeftSidebarProps) {
  const [activeResult, setActiveResult] = useState(MISSION_RESULTS[0]?.id);
  const isWarehouses = activeNav === "warehouses";

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="px-5 py-4 flex items-center gap-3 border-b border-neutral-100">
        <div className="size-8 rounded-lg bg-neutral-900 flex items-center justify-center">
          <span className="size-3 rounded-full bg-white" />
        </div>
        <div className="leading-none">
          <div className="font-semibold tracking-tight">KORD LOGISTICS</div>
          <div className="mt-1 text-[10px] uppercase tracking-widest text-neutral-400">
            Crisis Grid · v2026.06
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 pt-3 space-y-1">
        {NAV_ENTRIES.map((n) => (
          <NavItem
            key={n.id}
            active={activeNav === n.id}
            count={n.id === "warehouses" && warehouses.length ? warehouses.length : n.count}
            onClick={() => onNavChange(n.id)}
          >
            {n.label}
          </NavItem>
        ))}
      </nav>

      {/* Search */}
      <div className="px-4 pt-4">
        <Input placeholder={isWarehouses ? "Search warehouses…" : "Search tasks…"} />
      </div>

      {/* Filters */}
      <div className="px-4 pt-5 space-y-4">
        {isWarehouses ? (
          <WarehouseFilterPanel
            warehouses={warehouses}
            filters={filters}
            onToggle={onToggleFilter}
          />
        ) : (
          <>
            <FilterGroup label="Status" options={STATUS_FILTERS} />
            <FilterGroup label="Priority" options={PRIORITY_FILTERS} />
            <FilterGroup label="Cargo" options={CARGO_FILTERS} />
          </>
        )}
      </div>

      {/* Results */}
      <div className="px-4 pt-5 pb-2 flex items-center justify-between">
        <SectionLabel>Results</SectionLabel>
        <span className="text-[10px] tabular-nums text-neutral-400">
          {isWarehouses ? filteredWarehouses.length : MISSION_RESULTS.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        {isWarehouses ? (
          warehousesLoading ? (
            <p className="px-4 py-3 text-[11px] text-neutral-400">Loading warehouses…</p>
          ) : warehousesError ? (
            <p className="px-4 py-3 text-[11px] text-rose-500">{warehousesError}</p>
          ) : filteredWarehouses.length === 0 ? (
            <p className="px-4 py-3 text-[11px] text-neutral-400">No warehouses match the filters.</p>
          ) : (
            filteredWarehouses.map((w) => (
              <WarehouseCard
                key={w.id}
                warehouse={w}
                color={carrierColors.get(w.carrier_id) ?? "#525252"}
                active={selectedWarehouseId === w.id}
                onClick={() => onSelectWarehouse(w.id)}
              />
            ))
          )
        ) : (
          MISSION_RESULTS.map((r) => (
            <ResultCard
              key={r.id}
              result={r}
              active={activeResult === r.id}
              onClick={() => setActiveResult(r.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
