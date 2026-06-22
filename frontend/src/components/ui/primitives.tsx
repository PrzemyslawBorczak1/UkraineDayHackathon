// KORD Logistics design-system primitives.
// Visual language is documented in style_guides/kord-styles/STYLES.md.
// These are intentionally dumb/presentational so they stay reusable.
import * as React from "react";

/** Joins truthy class fragments — tiny local helper to avoid a clsx dependency. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Floating pill that sits over the map (header / control surfaces). */
export function HeaderPill({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "bg-white/95 backdrop-blur-md px-4 py-2 rounded-full ring-1 ring-black/5 shadow-sm flex items-center gap-4",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Pulsing status dot + label, e.g. LIVE. */
export function LiveDot({ label = "LIVE" }: { label?: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
      <span className="text-[11px] tabular-nums text-neutral-500">{label}</span>
    </span>
  );
}

/** Left-rail navigation row with an optional trailing count. */
export function NavItem({
  active,
  count,
  children,
  onClick,
}: {
  active?: boolean;
  count?: number;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
        active ? "bg-neutral-900 text-white" : "text-neutral-600 hover:bg-neutral-100"
      )}
    >
      <span className={cx("size-2 rounded-full", active ? "bg-white" : "bg-neutral-300")} />
      <span className="flex-1 text-left">{children}</span>
      {count != null && (
        <span
          className={cx(
            "text-[10px] tabular-nums",
            active ? "text-white/60" : "text-neutral-400"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/** Toggleable filter chip. */
export function Chip({
  on,
  children,
  onClick,
}: {
  on?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "px-2 py-1 text-[11px] font-medium rounded-md ring-1 transition-colors",
        on
          ? "bg-neutral-900 text-white ring-neutral-900"
          : "bg-white text-neutral-600 ring-neutral-200 hover:ring-neutral-400"
      )}
    >
      {children}
    </button>
  );
}

/** Micro uppercase section label — the signature KORD meta style. */
export function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h4
      className={cx(
        "text-[10px] font-bold uppercase tracking-widest text-neutral-400",
        className
      )}
    >
      {children}
    </h4>
  );
}

/** Subtle text input. */
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return (
    <input
      {...rest}
      className={cx(
        "w-full px-3 py-2 bg-neutral-100 rounded-lg text-sm border border-transparent",
        "focus:border-neutral-300 focus:bg-white outline-none transition-all",
        className
      )}
    />
  );
}

/** Pill-shaped call to action. */
export function CtaPill({
  children,
  onClick,
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
  className?: string;
}) {
  const styles =
    variant === "primary"
      ? "bg-neutral-900 text-white hover:bg-neutral-800"
      : "bg-white text-neutral-900 ring-1 ring-neutral-200 hover:ring-neutral-400";
  return (
    <button
      onClick={onClick}
      className={cx(
        "px-4 py-2 rounded-full text-sm font-medium transition-colors",
        styles,
        className
      )}
    >
      {children}
    </button>
  );
}

/** Badge used for statuses (maintenance / transit / queued …). */
export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "emerald" | "amber" | "rose" | "sky";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-neutral-100 text-neutral-600 ring-neutral-200",
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-200",
    amber: "bg-amber-50 text-amber-600 ring-amber-200",
    rose: "bg-rose-50 text-rose-600 ring-rose-200",
    sky: "bg-sky-50 text-sky-600 ring-sky-200",
  };
  return (
    <span
      className={cx(
        "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ring-1",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

/** KPI / metric card. */
export function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-black/5 p-5">
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-2 text-3xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-[11px] text-neutral-500">{hint}</div>}
    </div>
  );
}
