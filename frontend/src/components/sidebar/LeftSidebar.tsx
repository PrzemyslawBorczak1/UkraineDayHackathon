import { memo } from "react";
import { Chip, Input, NavItem, SectionLabel, cx } from "../ui";
import { NAV_ENTRIES } from "../../data/dispatch";
import type { CrisisSummary, MissionListItem, WarehouseSummary } from "../../types";
import {
  FACETS,
  availableOptions,
  type FacetKey,
  type WarehouseFilters,
} from "../../lib/warehouses";
import {
  cargoOptions,
  type MissionFacetKey,
  type MissionFilters,
} from "../../lib/missions";
import {
  CRISIS_FACETS,
  crisisOptions,
  type CrisisFacetKey,
  type CrisisFilters,
} from "../../lib/crisis";

// ── Cards ───────────────────────────────────────────────────────────────────

/** A mission row, with a carrier-colored dot matching its map color. */
const MissionCard = memo(function MissionCard({
  mission,
  color,
  active,
  onClick,
}: {
  mission: MissionListItem;
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
          <span className="text-sm font-semibold tabular-nums">{mission.id}</span>
        </span>
        <span className={cx("text-[10px] tracking-widest shrink-0", active ? "text-white/60" : "text-neutral-400")}>
          {mission.priority.toUpperCase()}
        </span>
      </div>
      <div className={cx("mt-1 text-[11px] truncate", active ? "text-white/70" : "text-neutral-500")}>
        {mission.cargo_type} · {mission.origin_point} → {mission.destination_point}
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

/** A crisis-point row, with a red severity dot. */
const CrisisCard = memo(function CrisisCard({
  crisis,
  active,
  onClick,
}: {
  crisis: CrisisSummary;
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
          <span className="size-2.5 shrink-0 rounded-full bg-red-600" />
          <span className="text-sm font-semibold truncate">{crisis.name}</span>
        </span>
        <span className={cx("text-[10px] tracking-widest shrink-0", active ? "text-white/60" : "text-neutral-400")}>
          {crisis.severity.toUpperCase()}
        </span>
      </div>
      <div className={cx("mt-1 text-[11px] truncate", active ? "text-white/70" : "text-neutral-500")}>
        {crisis.object_type} · {crisis.city} · {crisis.status}
      </div>
    </button>
  );
});

// ── Filter panels ────────────────────────────────────────────────────────────

/** Crisis facet filters — each chip row only shows values that still match. */
function CrisisFilterPanel({
  objects,
  filters,
  onToggle,
}: {
  objects: CrisisSummary[];
  filters: CrisisFilters;
  onToggle: (facet: CrisisFacetKey, value: string) => void;
}) {
  return (
    <>
      {CRISIS_FACETS.map(({ key, label }) => {
        const options = crisisOptions(objects, filters, key);
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

/** Carrier + cargo filters for missions; each chip row only shows valid values. */
function MissionFilterPanel({
  missions,
  filters,
  onToggle,
}: {
  missions: MissionListItem[];
  filters: MissionFilters;
  onToggle: (facet: MissionFacetKey, value: string) => void;
}) {
  const cargos = cargoOptions(missions, filters);

  return (
    <>
      {cargos.length > 0 && (
        <div className="space-y-2">
          <SectionLabel>Cargo</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {cargos.map((c) => (
              <Chip key={c} on={filters.cargo_type.has(c)} onClick={() => onToggle("cargo_type", c)}>
                {c}
              </Chip>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

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

// ── Sidebar ──────────────────────────────────────────────────────────────────

type LeftSidebarProps = {
  activeNav: string | undefined;
  onNavChange: (id: string) => void;

  // Warehouses view
  warehouses: WarehouseSummary[];
  warehousesLoading: boolean;
  warehousesError: string | null;
  filters: WarehouseFilters;
  onToggleFilter: (facet: FacetKey, value: string) => void;
  filteredWarehouses: WarehouseSummary[];
  warehouseCarrierColors: Map<string, string>;
  selectedWarehouseId: string | null;
  onSelectWarehouse: (id: string) => void;

  // Missions view
  missions: MissionListItem[];
  missionsLoading: boolean;
  missionsError: string | null;
  missionFilters: MissionFilters;
  onToggleMissionFilter: (facet: MissionFacetKey, value: string) => void;
  filteredMissions: MissionListItem[];
  missionCarrierColors: Map<string, string>;
  selectedMissionId: string | null;
  onSelectMission: (id: string) => void;

  // Crisis view
  crisis: CrisisSummary[];
  crisisLoading: boolean;
  crisisError: string | null;
  crisisFilters: CrisisFilters;
  onToggleCrisisFilter: (facet: CrisisFacetKey, value: string) => void;
  filteredCrisis: CrisisSummary[];
  selectedCrisisId: string | null;
  onSelectCrisis: (id: string) => void;
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
  warehouseCarrierColors,
  selectedWarehouseId,
  onSelectWarehouse,
  missions,
  missionsLoading,
  missionsError,
  missionFilters,
  onToggleMissionFilter,
  filteredMissions,
  missionCarrierColors,
  selectedMissionId,
  onSelectMission,
  crisis,
  crisisLoading,
  crisisError,
  crisisFilters,
  onToggleCrisisFilter,
  filteredCrisis,
  selectedCrisisId,
  onSelectCrisis,
}: LeftSidebarProps) {
  const isWarehouses = activeNav === "warehouses";
  const isCrisis = activeNav === "crisis";

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
            count={
              n.id === "warehouses"
                ? warehouses.length || n.count
                : n.id === "tasks"
                ? missions.length || n.count
                : n.id === "crisis"
                ? crisis.length || n.count
                : n.count
            }
            onClick={() => onNavChange(n.id)}
          >
            {n.label}
          </NavItem>
        ))}
      </nav>

      {/* Search */}
      <div className="px-4 pt-4">
        <Input
          placeholder={
            isWarehouses ? "Search warehouses…" : isCrisis ? "Search crisis points…" : "Search missions…"
          }
        />
      </div>

      {/* Filters */}
      <div className="px-4 pt-5 space-y-4">
        {isWarehouses ? (
          <WarehouseFilterPanel warehouses={warehouses} filters={filters} onToggle={onToggleFilter} />
        ) : isCrisis ? (
          <CrisisFilterPanel objects={crisis} filters={crisisFilters} onToggle={onToggleCrisisFilter} />
        ) : (
          <MissionFilterPanel missions={missions} filters={missionFilters} onToggle={onToggleMissionFilter} />
        )}
      </div>

      {/* Results */}
      <div className="px-4 pt-5 pb-2 flex items-center justify-between">
        <SectionLabel>Results</SectionLabel>
        <span className="text-[10px] tabular-nums text-neutral-400">
          {isWarehouses ? filteredWarehouses.length : isCrisis ? filteredCrisis.length : filteredMissions.length}
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
                color={warehouseCarrierColors.get(w.carrier_id) ?? "#525252"}
                active={selectedWarehouseId === w.id}
                onClick={() => onSelectWarehouse(w.id)}
              />
            ))
          )
        ) : isCrisis ? (
          crisisLoading ? (
            <p className="px-4 py-3 text-[11px] text-neutral-400">Loading crisis points…</p>
          ) : crisisError ? (
            <p className="px-4 py-3 text-[11px] text-rose-500">{crisisError}</p>
          ) : filteredCrisis.length === 0 ? (
            <p className="px-4 py-3 text-[11px] text-neutral-400">No crisis points match the filters.</p>
          ) : (
            filteredCrisis.map((c) => (
              <CrisisCard
                key={c.id}
                crisis={c}
                active={selectedCrisisId === c.id}
                onClick={() => onSelectCrisis(c.id)}
              />
            ))
          )
        ) : missionsLoading ? (
          <p className="px-4 py-3 text-[11px] text-neutral-400">Loading missions…</p>
        ) : missionsError ? (
          <p className="px-4 py-3 text-[11px] text-rose-500">{missionsError}</p>
        ) : filteredMissions.length === 0 ? (
          <p className="px-4 py-3 text-[11px] text-neutral-400">No missions match the filters.</p>
        ) : (
          filteredMissions.map((m) => (
            <MissionCard
              key={m.id}
              mission={m}
              color={missionCarrierColors.get(m.carrier_id) ?? "#525252"}
              active={selectedMissionId === m.id}
              onClick={() => onSelectMission(m.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
