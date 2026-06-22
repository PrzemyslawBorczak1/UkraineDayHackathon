import { CtaPill } from "../components/ui";
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
export function DispatchPage({ onNewMission }: { onNewMission: () => void }) {
  return (
    <DispatchShell left={<LeftSidebar />} right={<RightSidebar />}>
      {/* Map fills the stage. */}
      <div className="absolute inset-0">
        <MissionMap />
      </div>

      {/* Floating control layer — top bar. */}
      <div className="absolute top-4 left-4 right-4 z-500 pointer-events-none flex items-start justify-between gap-4">
        {/* Left cluster: timeline window. */}
        <div className="pointer-events-auto">
          <TimelineBar />
        </div>

        {/* Right cluster: stacked actions. */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <CtaPill variant="ghost" onClick={onNewMission}>+ New mission</CtaPill>
          <CtaPill>Summary →</CtaPill>
        </div>
      </div>
    </DispatchShell>
  );
}
