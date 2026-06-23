import { SectionLabel, Kpi, cx } from "../components/ui";

// ── Mock data ───────────────────────────────────────────────────────────────
// Hand-tuned to stay consistent with the dataset model (weekly budget ceiling
// 2.5M PLN vs ~3M demand → 83.5% fundable / 16.5% unfunded; mission states
// NEW→ACCEPTED→IN_PROGRESS→DONE; task phases Traveling/Transporting/PrepareUnload/
// Unload/Wait; refrigerated semis the daily bottleneck). Swap for a real
// /api/v1/summary endpoint later.

type Tone = "emerald" | "sky" | "amber" | "rose";

const BUDGET = {
  period: "This week (Mon–Sun)",
  ceiling: 2_500_000,
  committed: 2_184_500,
  demand: 2_992_235,
  fundablePct: 83.5,
  unfundedPct: 16.5,
  fundedMissions: 254,
  deferredMissions: 50, // unfunded — budget ceiling hit
};

const MISSIONS: { key: string; label: string; count: number; tone: Tone; bar: string }[] = [
  { key: "DONE", label: "Delivered", count: 96, tone: "emerald", bar: "bg-emerald-500" },
  { key: "IN_PROGRESS", label: "In progress", count: 117, tone: "sky", bar: "bg-sky-500" },
  { key: "ACCEPTED", label: "Accepted", count: 41, tone: "amber", bar: "bg-amber-500" },
  { key: "DEFERRED", label: "Deferred", count: 50, tone: "rose", bar: "bg-rose-400" },
];

const TASKS = {
  total: 612,
  completed: 232, // tasks belonging to delivered missions
  byPhase: [
    { label: "Transporting", count: 142, bar: "bg-sky-500" },
    { label: "Traveling", count: 88, bar: "bg-indigo-400" },
    { label: "Wait", count: 52, bar: "bg-neutral-400" },
    { label: "Unload", count: 51, bar: "bg-violet-500" },
    { label: "PrepareUnload", count: 47, bar: "bg-amber-400" },
  ],
};

// Per cargo type: delivered / planned / deferred. Each row's bar is a stacked
// 100%-of-itself bar (NOT scaled across rows): the most-saturated segment is
// delivered, then planned, then deferred. `shades` = [strong, mid, light] of one
// hue. Delivered totals sum to MISSIONS DONE (96); deferred to ~50.
const CARGO: {
  label: string;
  delivered: number;
  planned: number;
  deferred: number;
  shades: [string, string, string];
}[] = [
  { label: "Drinking water", delivered: 24, planned: 38, deferred: 12, shades: ["bg-sky-800", "bg-sky-300", "bg-sky-100"] },
  { label: "Food supplies", delivered: 21, planned: 34, deferred: 11, shades: ["bg-amber-800", "bg-amber-300", "bg-amber-100"] },
  { label: "Medical supplies", delivered: 18, planned: 28, deferred: 9, shades: ["bg-rose-800", "bg-rose-300", "bg-rose-100"] },
  { label: "Hygiene supplies", delivered: 12, planned: 20, deferred: 7, shades: ["bg-violet-800", "bg-violet-300", "bg-violet-100"] },
  { label: "Power generators", delivered: 9, planned: 16, deferred: 5, shades: ["bg-neutral-800", "bg-neutral-400", "bg-neutral-200"] },
  { label: "Shelter equipment", delivered: 7, planned: 12, deferred: 3, shades: ["bg-emerald-800", "bg-emerald-300", "bg-emerald-100"] },
  { label: "Rescue equipment", delivered: 5, planned: 10, deferred: 3, shades: ["bg-indigo-800", "bg-indigo-300", "bg-indigo-100"] },
];

const FRIDGE = { available: 14, demand: 15, pool: 40 };

// ── Helpers ─────────────────────────────────────────────────────────────────
const pln = (n: number) =>
  new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(n) + " PLN";
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);

const TONE: Record<Tone, string> = {
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-200",
  sky: "bg-sky-50 text-sky-600 ring-sky-200",
  amber: "bg-amber-50 text-amber-600 ring-amber-200",
  rose: "bg-rose-50 text-rose-600 ring-rose-200",
};

/** Status pill — inline-block so the ring stays a tidy box even when it wraps. */
function StatusChip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cx(
        "inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ring-1 leading-snug",
        TONE[tone]
      )}
    >
      {children}
    </span>
  );
}

function Bar({ value, className }: { value: number; className?: string }) {
  return (
    <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
      <div
        className={cx("h-full rounded-full", className)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cx("bg-white rounded-2xl ring-1 ring-black/5 p-5", className)}>{children}</div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export function SummaryPage({ onBack }: { onBack: () => void }) {
  const remaining = BUDGET.ceiling - BUDGET.committed;
  const utilization = pct(BUDGET.committed, BUDGET.ceiling);
  const completion = pct(TASKS.completed, TASKS.total);
  const maxMission = Math.max(...MISSIONS.map((m) => m.count));
  const maxPhase = Math.max(...TASKS.byPhase.map((p) => p.count));

  return (
    <div className="flex h-screen w-full bg-[#fafafa] font-sans overflow-hidden">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-8 py-4 bg-white border-b border-neutral-200">
        <div>
          <SectionLabel>Operations</SectionLabel>
          <h1 className="mt-1 text-lg font-semibold tracking-tight">Summary</h1>
        </div>
        <button onClick={onBack} className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
          ← Back to dispatch
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto pt-20 pb-12 px-8">
        <div className="max-w-5xl mx-auto py-6 space-y-8">

          {/* ── Budget ── */}
          <section className="space-y-4">
            <div className="flex items-end justify-between">
              <SectionLabel>Budget · {BUDGET.period}</SectionLabel>
              <span className="text-[11px] text-neutral-400">Ceiling does not roll over week to week</span>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <Kpi label="Weekly ceiling" value={pln(BUDGET.ceiling)} hint="Fixed budget" />
              <Kpi label="Committed" value={pln(BUDGET.committed)} hint={`${utilization}% utilised`} />
              <Kpi label="Remaining" value={pln(remaining)} hint="Available to fund" />
              <Kpi label="Demand" value={pln(BUDGET.demand)} hint={`${BUDGET.unfundedPct}% unfundable`} />
            </div>

            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Budget burn</span>
                <span className="text-sm tabular-nums text-neutral-500">
                  {pln(BUDGET.committed)} / {pln(BUDGET.ceiling)}
                </span>
              </div>
              <Bar value={utilization} className={utilization > 90 ? "bg-rose-500" : "bg-neutral-900"} />
              <div className="flex items-center justify-between text-[11px] text-neutral-500">
                <span>{utilization}% committed</span>
                <span>Demand exceeds ceiling by {pln(BUDGET.demand - BUDGET.ceiling)}</span>
              </div>

              {/* Funded vs deferred */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium">Mission funding</span>
                  <span className="tabular-nums text-neutral-500">
                    {BUDGET.fundedMissions} funded · {BUDGET.deferredMissions} deferred
                  </span>
                </div>
                <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
                  <div className="h-full bg-emerald-500" style={{ width: `${BUDGET.fundablePct}%` }} />
                  <div className="h-full bg-rose-400" style={{ width: `${BUDGET.unfundedPct}%` }} />
                </div>
                <div className="mt-1.5 flex items-center gap-4 text-[11px] text-neutral-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-500" /> Fundable {BUDGET.fundablePct}%
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-rose-400" /> Unfunded {BUDGET.unfundedPct}%
                  </span>
                </div>
              </div>
            </Card>
          </section>

          {/* ── Execution ── */}
          <section className="space-y-4">
            <SectionLabel>Execution</SectionLabel>

            <div className="grid grid-cols-3 gap-4">
              {/* Completion */}
              <Card className="col-span-1">
                <SectionLabel>Task completion</SectionLabel>
                <div className="mt-2 text-3xl font-semibold tabular-nums">{completion}%</div>
                <div className="mt-1 text-[11px] text-neutral-500">
                  {TASKS.completed} / {TASKS.total} tasks delivered
                </div>
                <div className="mt-3">
                  <Bar value={completion} className="bg-emerald-500" />
                </div>
              </Card>

              {/* Mission status breakdown — bars scaled to the largest bucket */}
              <Card className="col-span-2">
                <SectionLabel>Missions by status</SectionLabel>
                <div className="mt-3 space-y-2.5">
                  {MISSIONS.map((m) => (
                    <div key={m.key} className="flex items-center gap-3">
                      <div className="w-36 shrink-0">
                        <StatusChip tone={m.tone}>{m.label}</StatusChip>
                      </div>
                      <div className="flex-1">
                        <Bar value={pct(m.count, maxMission)} className={m.bar} />
                      </div>
                      <span className="w-10 text-right text-sm tabular-nums text-neutral-600">{m.count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* By cargo type — each bar is delivered → planned → deferred (own scale) */}
            <Card>
              <div className="flex items-center justify-between">
                <SectionLabel>By cargo type</SectionLabel>
                <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-sm bg-neutral-800" /> Delivered
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-sm bg-neutral-300" /> Planned
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-sm bg-neutral-200 ring-1 ring-neutral-300" /> Deferred
                  </span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2.5">
                {CARGO.map((c) => {
                  const total = c.delivered + c.planned + c.deferred;
                  return (
                    <div key={c.label} className="flex items-center gap-3">
                      <span className="w-32 shrink-0 text-xs text-neutral-600">{c.label}</span>
                      <div className="flex-1">
                        <div className="flex h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                          <div className={cx("h-full", c.shades[0])} style={{ width: `${pct(c.delivered, total)}%` }} />
                          <div className={cx("h-full", c.shades[1])} style={{ width: `${pct(c.planned, total)}%` }} />
                          <div className={cx("h-full", c.shades[2])} style={{ width: `${pct(c.deferred, total)}%` }} />
                        </div>
                      </div>
                      <span className="w-20 text-right text-xs tabular-nums text-neutral-500">
                        {c.delivered}/{c.planned}/{c.deferred}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Task phase pulse + fridge bottleneck */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="col-span-2">
                <SectionLabel>Fleet by task phase</SectionLabel>
                <div className="mt-3 space-y-2.5">
                  {TASKS.byPhase.map((p) => (
                    <div key={p.label} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 text-xs text-neutral-600">{p.label}</span>
                      <div className="flex-1">
                        <Bar value={pct(p.count, maxPhase)} className={p.bar} />
                      </div>
                      <span className="w-10 text-right text-sm tabular-nums text-neutral-600">{p.count}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="col-span-1">
                <SectionLabel>Refrigerated semis</SectionLabel>
                <div className="mt-2 text-3xl font-semibold tabular-nums">
                  {FRIDGE.available}
                  <span className="text-lg text-neutral-400"> / {FRIDGE.demand}</span>
                </div>
                <div className="mt-1 text-[11px] text-neutral-500">
                  available vs. today's cold-chain demand
                </div>
                <div className="mt-3">
                  <Bar
                    value={pct(FRIDGE.available, FRIDGE.demand)}
                    className={FRIDGE.available < FRIDGE.demand ? "bg-rose-500" : "bg-emerald-500"}
                  />
                </div>
                <div className="mt-2 text-[11px] text-neutral-500">
                  Pool of {FRIDGE.pool} · daily bottleneck
                </div>
              </Card>
            </div>
          </section>

          <p className="text-center text-[11px] text-neutral-400">
            Mock figures — wiring to a live <code>/api/v1/summary</code> endpoint later.
          </p>
        </div>
      </div>
    </div>
  );
}
