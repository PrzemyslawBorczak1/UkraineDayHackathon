import { useMemo, useState } from "react";
import { HeaderPill, SectionLabel, cx } from "../ui";

/** The time window the dispatcher is looking at. */
export type TimeWindow = {
  start: Date;
  end: Date;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Slider travels from -30 days to +30 days around the window's anchor. */
const OFFSET_MIN = -30;
const OFFSET_MAX = 30;

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

function CalendarIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-neutral-400"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

/** Read-only date stamp shown as a soft inset field. */
function DateField({ value }: { value: Date }) {
  return (
    <span className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-lg">
      <CalendarIcon />
      <span className="text-sm font-medium tabular-nums">{formatStamp(value)}</span>
    </span>
  );
}

/**
 * Floating timeline control: shows the active window (start → end + span) and a
 * draggable slider that shifts the whole window earlier/later in time.
 *
 * Controlled if `value`/`onChange` are supplied, otherwise self-managing — so
 * it drops into the page now and can be wired to shared state later.
 */
export function TimelineBar({
  value,
  onChange,
  className,
}: {
  value?: TimeWindow;
  onChange?: (next: TimeWindow) => void;
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

  // The anchor is the window's start; the slider expresses an offset (days)
  // applied on top of it. Width of the window is preserved while sliding.
  const [offset, setOffset] = useState(0);
  const width = window.end.getTime() - window.start.getTime();

  const shifted = useMemo<TimeWindow>(() => {
    const start = new Date(window.start.getTime() + offset * DAY_MS);
    return { start, end: new Date(start.getTime() + width) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [window.start, width, offset]);

  const handleSlide = (nextOffset: number) => {
    setOffset(nextOffset);
    const start = new Date(window.start.getTime() + nextOffset * DAY_MS);
    setWindow({ start, end: new Date(start.getTime() + width) });
  };

  return (
    <HeaderPill className={cx("flex-col !items-stretch gap-3 px-5 py-3 min-w-[420px]", className)}>
      <div className="flex items-center gap-3">
        <SectionLabel className="shrink-0">Window</SectionLabel>
        <DateField value={shifted.start} />
        <span className="text-neutral-300">→</span>
        <DateField value={shifted.end} />
        <div className="h-4 w-px bg-neutral-200" />
        <span className="text-[11px] tabular-nums text-neutral-500 shrink-0">
          {spanDays(shifted)}d span
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[10px] tabular-nums text-neutral-400 w-8 text-right">
          {OFFSET_MIN}d
        </span>
        <input
          type="range"
          min={OFFSET_MIN}
          max={OFFSET_MAX}
          step={1}
          value={offset}
          onChange={(e) => handleSlide(Number(e.target.value))}
          className="kord-range flex-1"
        />
        <span className="text-[10px] tabular-nums text-neutral-400 w-8">+{OFFSET_MAX}d</span>
      </div>
    </HeaderPill>
  );
}
