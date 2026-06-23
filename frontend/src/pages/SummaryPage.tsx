import { Badge, Kpi, SectionLabel, cx } from "../components/ui";
import type { BadgeTone } from "../components/ui";

// ── Fake dashboard data (placeholder until real analytics exist) ────────────

const KPIS = [
  { label: "Active missions", value: "128", hint: "+12 vs. yesterday" },
  { label: "Vehicles en route", value: "342", hint: "58% of fleet" },
  { label: "Warehouses online", value: "24", hint: "all regions covered" },
  { label: "Crisis zones", value: "9", hint: "3 critical" },
];

const STATUS_BREAKDOWN = [
  { label: "In transit", value: 68, tone: "emerald" as BadgeTone },
  { label: "Scheduled", value: 41, tone: "amber" as BadgeTone },
  { label: "Delivered (24h)", value: 213, tone: "sky" as BadgeTone },
  { label: "Delayed", value: 7, tone: "rose" as BadgeTone },
];

const CARGO_MIX = [
  { label: "Medical supplies", pct: 31 },
  { label: "Food supplies", pct: 24 },
  { label: "Fuel", pct: 18 },
  { label: "Generators", pct: 14 },
  { label: "Hygiene supplies", pct: 13 },
];

const CARRIERS = [
  { name: "RapidDelta Sp.j.", missions: 42, onTime: 98, risk: "Low" as const },
  { name: "NordFracht Logistics", missions: 37, onTime: 95, risk: "Low" as const },
  { name: "KresyTrans", missions: 28, onTime: 89, risk: "Medium" as const },
  { name: "Wisła Cargo", missions: 21, onTime: 82, risk: "Medium" as const },
  { name: "Sarmat Transport", missions: 14, onTime: 74, risk: "High" as const },
];

const ACTIVITY = [
  { time: "08:42", text: "Mission M0148 delivered to Lviv Hub 1", tone: "emerald" as BadgeTone },
  { time: "08:31", text: "Convoy KV-5655C departed Kraków", tone: "sky" as BadgeTone },
  { time: "08:05", text: "New crisis zone flagged near Przemyśl", tone: "rose" as BadgeTone },
  { time: "07:50", text: "Warehouse W012 capacity below 20%", tone: "amber" as BadgeTone },
  { time: "07:18", text: "Mission M0140 reassigned to NordFracht", tone: "neutral" as BadgeTone },
];

const RISK_TONE: Record<"Low" | "Medium" | "High", BadgeTone> = {
  Low: "emerald",
  Medium: "amber",
  High: "rose",
};

const maxStatus = Math.max(...STATUS_BREAKDOWN.map((s) => s.value));

const BAR_COLOR: Record<BadgeTone, string> = {
  neutral: "bg-neutral-400",
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
  sky: "bg-sky-500",
};

export function SummaryPage({ onBack }: { onBack: () => void }) {
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

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto pt-20 pb-12 px-8">
        <div className="max-w-5xl mx-auto space-y-8 py-6">
          {/* Demo banner */}
          <div className="rounded-xl bg-amber-50 ring-1 ring-amber-200 px-4 py-2.5 text-[11px] text-amber-700">
            Demo data — these figures are placeholders, not live analytics.
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {KPIS.map((k) => (
              <Kpi key={k.label} label={k.label} value={k.value} hint={k.hint} />
            ))}
          </div>

          {/* Status + cargo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl ring-1 ring-black/5 p-5">
              <SectionLabel>Mission status</SectionLabel>
              <div className="mt-4 space-y-3">
                {STATUS_BREAKDOWN.map((s) => (
                  <div key={s.label}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-neutral-600">{s.label}</span>
                      <span className="tabular-nums text-neutral-400">{s.value}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className={cx("h-full rounded-full", BAR_COLOR[s.tone])}
                        style={{ width: `${(s.value / maxStatus) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl ring-1 ring-black/5 p-5">
              <SectionLabel>Cargo mix</SectionLabel>
              <div className="mt-4 space-y-3">
                {CARGO_MIX.map((c) => (
                  <div key={c.label}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-neutral-600">{c.label}</span>
                      <span className="tabular-nums text-neutral-400">{c.pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                      <div className="h-full rounded-full bg-neutral-900" style={{ width: `${c.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Carrier table */}
          <div className="bg-white rounded-2xl ring-1 ring-black/5 p-5">
            <SectionLabel>Carrier performance</SectionLabel>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-neutral-400 text-left">
                    <th className="font-medium pb-2">Carrier</th>
                    <th className="font-medium pb-2 text-right">Missions</th>
                    <th className="font-medium pb-2 text-right">On-time</th>
                    <th className="font-medium pb-2 text-right">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {CARRIERS.map((c) => (
                    <tr key={c.name} className="border-t border-neutral-100">
                      <td className="py-2.5 font-medium">{c.name}</td>
                      <td className="py-2.5 text-right tabular-nums">{c.missions}</td>
                      <td className="py-2.5 text-right tabular-nums">{c.onTime}%</td>
                      <td className="py-2.5 text-right">
                        <Badge tone={RISK_TONE[c.risk]}>{c.risk}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity feed */}
          <div className="bg-white rounded-2xl ring-1 ring-black/5 p-5">
            <SectionLabel>Recent activity</SectionLabel>
            <div className="mt-4 space-y-3">
              {ACTIVITY.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-[10px] tabular-nums text-neutral-400 w-10 shrink-0 pt-0.5">{a.time}</span>
                  <span className={cx("mt-1 size-2 rounded-full shrink-0", BAR_COLOR[a.tone])} />
                  <span className="text-[13px] text-neutral-700">{a.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
