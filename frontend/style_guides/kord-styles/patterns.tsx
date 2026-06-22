// KORD Logistics — gotowe wzorce UI. Tailwind v4, bez zależności od shadcn.
import * as React from "react";

export function HeaderPill({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-full ring-1 ring-black/5 shadow-sm flex items-center gap-4">
      {children}
    </div>
  );
}

export function LiveDot({ label = "LIVE" }: { label?: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
      <span className="text-[11px] tabular-nums text-neutral-500">{label}</span>
    </span>
  );
}

export function NavItem({
  active, count, children, onClick,
}: { active?: boolean; count?: number; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        active ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
      }`}
    >
      <span className={`size-2 rounded-full ${active ? "bg-white" : "bg-neutral-300"}`} />
      <span className="flex-1 text-left">{children}</span>
      {count != null && (
        <span className={`text-[10px] tabular-nums ${active ? "text-white/60" : "text-neutral-400"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

export function Chip({
  on, children, onClick,
}: { on?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-[11px] font-medium rounded-md ring-1 transition-colors ${
        on
          ? "bg-neutral-900 text-white ring-neutral-900"
          : "bg-white text-neutral-600 ring-neutral-200 hover:ring-neutral-400"
      }`}
    >
      {children}
    </button>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{children}</h4>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 bg-neutral-100 rounded-lg text-sm border border-transparent
        focus:border-neutral-300 focus:bg-white outline-none transition-all ${props.className ?? ""}`}
    />
  );
}

export function CtaPill({
  children, onClick, variant = "primary",
}: { children: React.ReactNode; onClick?: () => void; variant?: "primary" | "ghost" }) {
  const base = "px-4 py-2 rounded-full text-sm font-medium transition-colors";
  const styles =
    variant === "primary"
      ? "bg-neutral-900 text-white hover:bg-neutral-800"
      : "bg-white text-neutral-900 ring-1 ring-neutral-200 hover:ring-neutral-400";
  return (
    <button onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

export function Kpi({
  label, value, hint,
}: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-black/5 p-5">
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-2 text-3xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-neutral-500">{hint}</div>}
    </div>
  );
}

export function AppShell({
  sidebar, children,
}: { sidebar: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full bg-[#fafafa] text-neutral-900 antialiased overflow-hidden font-sans">
      <aside className="w-80 shrink-0 border-r border-neutral-200 flex flex-col bg-white z-20">
        {sidebar}
      </aside>
      <main className="relative flex-1 bg-neutral-100">{children}</main>
    </div>
  );
}
