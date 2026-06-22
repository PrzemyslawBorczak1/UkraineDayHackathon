import * as React from "react";

/**
 * Top-level dispatch layout: a left rail, a central stage (the map), and a
 * right rail. The center is `relative` so floating overlays (header pills,
 * timeline) can be positioned over the map.
 *
 * Every region is a slot, so the page can swap real content in without
 * touching the layout. Sidebar widths are overridable for future tuning.
 */
export function DispatchShell({
  left,
  right,
  leftWidth = "w-80",
  rightWidth = "w-96",
  children,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
  leftWidth?: string;
  rightWidth?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-[#fafafa] text-neutral-900 antialiased overflow-hidden font-sans">
      {left && (
        <aside
          className={`${leftWidth} shrink-0 border-r border-neutral-200 flex flex-col bg-white z-20`}
        >
          {left}
        </aside>
      )}

      <main className="relative flex-1 min-w-0 bg-neutral-100">{children}</main>

      {right && (
        <aside
          className={`${rightWidth} shrink-0 border-l border-neutral-200 flex flex-col bg-white z-20`}
        >
          {right}
        </aside>
      )}
    </div>
  );
}
