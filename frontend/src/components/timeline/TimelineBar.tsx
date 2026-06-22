import { useEffect, useState } from "react";
import { HeaderPill, SectionLabel, cx } from "../ui";

/** The time window the dispatcher is looking at. */
export type TimeWindow = {
  start: Date;
  end: Date;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

/** Formats a date like "21 Jun 11:00". */
function formatStamp(d: Date): string {
  const day = d.getDate().toString().padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${day} ${month} ${hh}:${mm}`;
}

/** Whole-day span between two dates. */
function spanDays(w: TimeWindow): number {
  return Math.max(0, Math.round((w.end.getTime() - w.start.getTime()) / DAY_MS));
}

/** Date -> value string for <input type="datetime-local"> (local time). */
function toInputValue(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Editable date field — a visible, styled native datetime-local input. */
function DateField({
  value,
  onChange,
}: {
  value: Date;
  onChange: (next: Date) => void;
}) {
  return (
    <span className="flex items-center px-3 py-1.5 bg-neutral-100 rounded-lg hover:bg-neutral-200/70 transition-colors focus-within:ring-1 focus-within:ring-neutral-300">
      <input
        type="datetime-local"
        value={toInputValue(value)}
        onChange={(e) => {
          const next = new Date(e.target.value);
          if (!Number.isNaN(next.getTime())) onChange(next);
        }}
        className="kord-datetime bg-transparent text-sm font-medium tabular-nums outline-none cursor-pointer"
      />
    </span>
  );
}

/**
 * Floating timeline control. The dispatcher picks a start and end date, and a
 * single playhead slider scrubs a cursor across that range (start → end).
 *
 * `value`/`onChange` control the window bounds. The cursor is reported via the
 * optional `onCursorChange` so callers can drive the map/time view later.
 * Controlled-or-uncontrolled, so it works dropped in as-is.
 */
export function TimelineBar({
  value,
  onChange,
  onCursorChange,
  className,
}: {
  value?: TimeWindow;
  onChange?: (next: TimeWindow) => void;
  onCursorChange?: (cursor: Date) => void;
  className?: string;
}) {
  // Default window: an 8-day span starting "now-ish".
  const [internal, setInternal] = useState<TimeWindow>(() => {
    const start = new Date();
    start.setHours(11, 0, 0, 0);
    const end = new Date(start.getTime() + 8 * DAY_MS);
    return { start, end };
  });

  const window = value ?? internal;
  const setWindow = (next: TimeWindow) => {
    if (onChange) onChange(next);
    else setInternal(next);
  };

  // Cursor position (ms epoch) somewhere between start and end.
  const [cursor, setCursor] = useState<number>(() => window.start.getTime());

  // Keep the cursor inside the window whenever the bounds change.
  useEffect(() => {
    setCursor((c) => clamp(c, window.start.getTime(), window.end.getTime()));
  }, [window.start, window.end]);

  const setStart = (start: Date) => {
    // Never let start cross end; keep at least one hour of range.
    const end = window.end.getTime() <= start.getTime()
      ? new Date(start.getTime() + DAY_MS)
      : window.end;
    setWindow({ start, end });
  };

  const setEnd = (end: Date) => {
    const start = end.getTime() <= window.start.getTime()
      ? new Date(end.getTime() - DAY_MS)
      : window.start;
    setWindow({ start, end });
  };

  const handleScrub = (next: number) => {
    const clamped = clamp(next, window.start.getTime(), window.end.getTime());
    setCursor(clamped);
    onCursorChange?.(new Date(clamped));
  };

  const cursorDate = new Date(clamp(cursor, window.start.getTime(), window.end.getTime()));

  return (
    <HeaderPill
      className={cx("flex-col items-stretch! gap-3 px-5 py-3 min-w-105", className)}
    >
      <div className="flex items-center gap-3">
        <SectionLabel className="shrink-0">Window</SectionLabel>
        <DateField value={window.start} onChange={setStart} />
        <span className="text-neutral-300">→</span>
        <DateField value={window.end} onChange={setEnd} />
        <div className="h-4 w-px bg-neutral-200" />
        <span className="text-[11px] tabular-nums text-neutral-500 shrink-0">
          {spanDays(window)}d span
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[10px] tabular-nums text-neutral-400 shrink-0">
          {formatStamp(window.start)}
        </span>
        <input
          type="range"
          min={window.start.getTime()}
          max={window.end.getTime()}
          step={HOUR_MS}
          value={cursorDate.getTime()}
          onChange={(e) => handleScrub(Number(e.target.value))}
          className="kord-range flex-1"
        />
        <span className="text-[10px] tabular-nums text-neutral-400 shrink-0">
          {formatStamp(window.end)}
        </span>
      </div>

      <div className="text-center text-[11px] tabular-nums text-neutral-500">
        Cursor · {formatStamp(cursorDate)}
      </div>
    </HeaderPill>
  );
}
