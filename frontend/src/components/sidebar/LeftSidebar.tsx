import { useState } from "react";
import { Chip, Input, NavItem, SectionLabel, cx } from "../ui";

// Static placeholder data — swap for real queries later.
const NAV = [
  { id: "tasks", label: "Tasks", count: 240 },
  { id: "vehicles", label: "Carriers' Vehicles", count: 640 },
  { id: "warehouses", label: "Warehouses", count: 36 },
];

const STATUS = ["queued", "transit", "delivered", "delayed"];
const PRIORITY = ["P1", "P2", "P3"];
const CARGO = ["medical", "food", "fuel", "shelter", "equipment"];

const RESULTS = [
  { id: "MS-0001", tag: "EQUIPMENT", route: "Kraków Hub 1 → Lviv Hub 1", active: true },
  { id: "MS-0002", tag: "FUEL", route: "Kraków Hub 3 → Kyiv Hub 1" },
  { id: "MS-0003", tag: "MEDICAL", route: "Lublin Hub 3 → Przemyśl Hub 2" },
  { id: "MS-0004", tag: "MEDICAL", route: "Rzeszów Hub 1 → Kyiv Hub 2" },
];

/** A filter-group block: label + a wrapping row of toggle chips. */
function FilterGroup({ label, options }: { label: string; options: string[] }) {
  const [on, setOn] = useState<Set<string>>(new Set());
  const toggle = (v: string) =>
    setOn((prev) => {
      const next = new Set(prev);
      next.has(v) ? next.delete(v) : next.add(v);
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
}

/** A single mission row in the results list. */
function ResultCard({
  id,
  tag,
  route,
  active,
}: {
  id: string;
  tag: string;
  route: string;
  active?: boolean;
}) {
  return (
    <button
      className={cx(
        "w-full text-left rounded-lg px-4 py-3 transition-colors",
        active ? "bg-neutral-900 text-white" : "hover:bg-neutral-100"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold tabular-nums">{id}</span>
        <span className={cx("text-[10px] tracking-widest", active ? "text-white/60" : "text-neutral-400")}>
          {tag}
        </span>
      </div>
      <div className={cx("mt-1 text-[11px]", active ? "text-white/70" : "text-neutral-500")}>
        {route}
      </div>
    </button>
  );
}

/** Left rail: brand, navigation, search and the filtered results list. */
export function LeftSidebar() {
  const [active, setActive] = useState("tasks");

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
        {NAV.map((n) => (
          <NavItem
            key={n.id}
            active={active === n.id}
            count={n.count}
            onClick={() => setActive(n.id)}
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
        <FilterGroup label="Status" options={STATUS} />
        <FilterGroup label="Priority" options={PRIORITY} />
        <FilterGroup label="Cargo" options={CARGO} />
      </div>

      {/* Results */}
      <div className="px-4 pt-5 pb-2 flex items-center justify-between">
        <SectionLabel>Results</SectionLabel>
        <span className="text-[10px] tabular-nums text-neutral-400">240</span>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
        {RESULTS.map((r) => (
          <ResultCard key={r.id} {...r} />
        ))}
      </div>
    </div>
  );
}
