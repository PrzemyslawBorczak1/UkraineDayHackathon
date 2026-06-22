import { CtaPill, HeaderPill, LiveDot } from "../components/ui";
import { DispatchShell } from "../components/layout/DispatchShell";
import { MissionMap } from "../components/map/MissionMap";
import { TimelineBar } from "../components/timeline/TimelineBar";
import { LeftSidebar } from "../components/sidebar/LeftSidebar";
import { RightSidebar } from "../components/sidebar/RightSidebar";

/**
 * KORD dispatch view: left rail (tasks/filters), central map stage with
 * floating controls, and right rail (mission detail).
 *
 * Floating overlays live in a `pointer-events-none` layer so the map stays
 * draggable; interactive pills opt back in with `pointer-events-auto`.
 */
export function DispatchPage() {
  return (
    <DispatchShell left={<LeftSidebar />} right={<RightSidebar />}>
      {/* Map fills the stage. */}
      <div className="absolute inset-0">
        <MissionMap />
      </div>

      {/* Floating control layer. */}
      <div className="absolute inset-0 z-[500] pointer-events-none p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left cluster: live task counter + timeline window. */}
          <div className="flex items-start gap-3 pointer-events-auto">
            <HeaderPill className="flex-col !items-start gap-0 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-semibold tabular-nums leading-none">240</span>
                <span className="text-[11px] text-neutral-500">Tasks</span>
              </div>
              <div className="mt-1">
                <LiveDot label="on map" />
              </div>
            </HeaderPill>

            <TimelineBar />
          </div>

          {/* Right cluster: actions. */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <CtaPill variant="ghost">+ New mission</CtaPill>
            <CtaPill>Summary →</CtaPill>
          </div>
        </div>
      </div>
    </DispatchShell>
  );
}
