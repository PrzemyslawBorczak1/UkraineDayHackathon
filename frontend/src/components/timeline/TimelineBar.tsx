import { useCallback, useEffect, useState } from "react";
import { CalendarIcon, HeaderPill, SectionLabel, cx } from "../ui";
import { DAY_MS, HOUR_MS, clamp, formatStamp, spanDays, toInputValue } from "../../lib/time";
import type { TimeWindow } from "../../types";

export type { TimeWindow };

/** Editable date field — a visible, styled native datetime-local input. */
function DateField({
  value,
  onChange,
}: {
  value: Date;
  onChange: (next: Date) => void;
}) {
  return (
    <span className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-lg hover:bg-neutral-200/70 transition-colors focus-within:ring-1 focus-within:ring-neutral-300">
      <CalendarIcon className="text-neutral-400" />
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
  cursor,
  onCursorChange,
  playing,
  onPlayToggle,
  className,
}: {
  value?: TimeWindow;
  onChange?: (next: TimeWindow) => void;
  /** When provided, the playhead is controlled by the parent. */
  cursor?: Date;
  onCursorChange?: (cursor: Date) => void;
  playing?: boolean;
  onPlayToggle?: () => void;
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
  const setWindow = useCallback(
    (next: TimeWindow) => (onChange ? onChange(next) : setInternal(next)),
    [onChange]
  );

  // Cursor position (ms epoch). Controlled by the parent when `cursor` is given,
  // otherwise tracked internally so the bar still works standalone.
  const controlledCursor = cursor !== undefined;
  const [internalCursor, setInternalCursor] = useState<number>(() => window.start.getTime());

  // Keep the internal cursor inside the window whenever the bounds change.
  useEffect(() => {
    if (controlledCursor) return;
    setInternalCursor((c) => clamp(c, window.start.getTime(), window.end.getTime()));
  }, [controlledCursor, window.start, window.end]);

  const setStart = useCallback(
    (start: Date) => {
      // Never let start cross end; keep at least a day of range.
      const end =
        window.end.getTime() <= start.getTime()
          ? new Date(start.getTime() + DAY_MS)
          : window.end;
      setWindow({ start, end });
    },
    [window.end, setWindow]
  );

  const setEnd = useCallback(
    (end: Date) => {
      const start =
        end.getTime() <= window.start.getTime()
          ? new Date(end.getTime() - DAY_MS)
          : window.start;
      setWindow({ start, end });
    },
    [window.start, setWindow]
  );

  const handleScrub = useCallback(
    (next: number) => {
      const clamped = clamp(next, window.start.getTime(), window.end.getTime());
      if (!controlledCursor) setInternalCursor(clamped);
      onCursorChange?.(new Date(clamped));
    },
    [controlledCursor, window.start, window.end, onCursorChange]
  );

  const cursorMs = controlledCursor ? cursor!.getTime() : internalCursor;
  const cursorDate = new Date(clamp(cursorMs, window.start.getTime(), window.end.getTime()));

  return (
    <HeaderPill
      className={cx("flex-col items-stretch! gap-3 px-5 py-3 min-w-105 rounded-xl!", className)}
    >
      <div className="flex items-center gap-3">
        <SectionLabel className="shrink-0">Window</SectionLabel>
        <DateField value={window.start} onChange={setStart} />
        <span className="text-neutral-300">→</span>
        <DateField value={window.end} onChange={setEnd} />
        <div className="h-4 w-px bg-neutral-200" />
        <span className="text-[11px] tabular-nums text-neutral-500 shrink-0">
          {spanDays(window.start, window.end)}d span
        </span>
      </div>

      <div className="flex items-center gap-3">
        {onPlayToggle && (
          <button
            onClick={onPlayToggle}
            className="shrink-0 size-7 flex items-center justify-center rounded-full bg-neutral-900 text-white text-[11px] hover:bg-neutral-700 transition-colors"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? "❚❚" : "▶"}
          </button>
        )}
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
