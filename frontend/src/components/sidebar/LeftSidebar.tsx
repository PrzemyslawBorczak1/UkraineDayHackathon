import { memo, useState } from "react";
import { Chip, Input, NavItem, SectionLabel, cx } from "../ui";
import {
  CARGO_FILTERS,
  MISSION_RESULTS,
  NAV_ENTRIES,
  PRIORITY_FILTERS,
  STATUS_FILTERS,
} from "../../data/dispatch";
import type { MissionResult } from "../../types";

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

/** Left rail: brand, navigation, search and the filtered results list. */
export function LeftSidebar() {
  const [activeNav, setActiveNav] = useState(NAV_ENTRIES[0]?.id);
  const [activeResult, setActiveResult] = useState(MISSION_RESULTS[0]?.id);

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
            count={n.count}
            onClick={() => setActiveNav(n.id)}
          >
            {n.label}
          </NavItem>
        ))}
      </nav>

      {/* Search */}
      <div className="px-4 pt-4">
        <Input placeholder="Search tasks…" />
      </div>

      {/* Filters */}
      <div className="px-4 pt-5 space-y-4">
        <FilterGroup label="Status" options={STATUS_FILTERS} />
        <FilterGroup label="Priority" options={PRIORITY_FILTERS} />
        <FilterGroup label="Cargo" options={CARGO_FILTERS} />
      </div>

      {/* Results */}
      <div className="px-4 pt-5 pb-2 flex items-center justify-between">
        <SectionLabel>Results</SectionLabel>
        <span className="text-[10px] tabular-nums text-neutral-400">{MISSION_RESULTS.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        {MISSION_RESULTS.map((r) => (
          <ResultCard
            key={r.id}
            result={r}
            active={activeResult === r.id}
            onClick={() => setActiveResult(r.id)}
          />
        ))}
      </div>
    </div>
  );
}
