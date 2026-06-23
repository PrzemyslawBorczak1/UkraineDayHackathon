import { Fragment, useEffect, useMemo } from "react";
import { CircleMarker, Polyline, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import type { MissionAnimation } from "../../types";
import { pointAlongRoute, progressOf } from "../../lib/geo";
import { useOSRMRoutes } from "../../hooks/useOSRMRoutes";

/** Fits the map to every mission's route once, when the set loads. */
function FitToAll({ animations }: { animations: MissionAnimation[] }) {
  const map = useMap();
  useEffect(() => {
    const points = animations.flatMap((a) => [a.origin, a.destination]);
    if (points.length === 0) return;
    map.fitBounds(L.latLngBounds(points as [number, number][]), { padding: [56, 56], maxZoom: 8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, animations.length]);
  return null;
}

/**
 * Draws missions on a shared timeline. A mission's path + vehicles only appear
 * while the cursor is inside that mission's [start, end] window — so routes pop
 * in when they begin, the convoy drives along, and they vanish once delivered.
 */
export function MissionTimelineLayer({
  animations,
  cursorMs,
  colors,
  selectedId,
  onSelect,
}: {
  animations: MissionAnimation[];
  cursorMs: number;
  colors: Map<string, string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const routeRequests = useMemo(
    () => animations.map((a) => ({ id: a.id, origin: a.origin, destination: a.destination })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [animations.length]
  );
  const osrmRoutes = useOSRMRoutes(routeRequests);

  return (
    <>
      {animations.map((a) => {
        const start = Date.parse(a.start);
        const end = Date.parse(a.end);
        // Outside its own window → not on the road yet / already delivered.
        if (cursorMs < start || cursorMs > end) return null;

        const progress = progressOf(start, end, cursorMs);
        const color = colors.get(a.carrier_id) ?? "#6366f1";
        const isSelected = selectedId === a.id;
        const roadRoute = osrmRoutes.get(a.id);

        return (
          <Fragment key={a.id}>
            {/* Origin / destination anchors */}
            <CircleMarker
              center={a.origin}
              radius={5}
              pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#111827", fillOpacity: 1 }}
            >
              <Tooltip direction="top">Origin · {a.origin_point}</Tooltip>
            </CircleMarker>
            <CircleMarker
              center={a.destination}
              radius={5}
              pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#10b981", fillOpacity: 1 }}
            >
              <Tooltip direction="top">Destination · {a.destination_point}</Tooltip>
            </CircleMarker>

            {/* Per-vehicle dashed route + moving marker */}
            {a.vehicles.map((v) => {
              const route = roadRoute ?? v.route;
              const pos = pointAlongRoute(route, progress);
              return (
                <Fragment key={v.id}>
                  <Polyline
                    positions={route}
                    pathOptions={{
                      color,
                      weight: isSelected ? 3 : 2,
                      opacity: isSelected ? 0.85 : 0.45,
                      dashArray: "6 6",
                    }}
                    eventHandlers={{ click: () => onSelect(a.id) }}
                  />
                  <CircleMarker
                    center={pos as [number, number]}
                    radius={isSelected ? 9 : 7}
                    pathOptions={{
                      color: isSelected ? "#111827" : "#ffffff",
                      weight: isSelected ? 3 : 2,
                      fillColor: color,
                      fillOpacity: 0.95,
                    }}
                    eventHandlers={{ click: () => onSelect(a.id) }}
                  >
                    <Tooltip direction="top" offset={[0, -6]}>
                      <div className="text-[11px] leading-tight">
                        <div className="font-semibold">{v.id}</div>
                        <div className="text-neutral-500">{v.vehicle_type}</div>
                        <div className="text-neutral-400">{Math.round(progress * 100)}% · {a.cargo_type}</div>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                </Fragment>
              );
            })}
          </Fragment>
        );
      })}

      <FitToAll animations={animations} />
    </>
  );
}
