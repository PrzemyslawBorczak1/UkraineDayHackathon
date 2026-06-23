import { Fragment, useEffect } from "react";
import { Circle, CircleMarker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import type { CrisisSummary } from "../../types";
import { crisisOpacity, crisisRadius } from "../../lib/crisis";

const RED = "#dc2626";

/** Fits the map to the crisis points whenever the set changes. */
function FitToCrisis({ objects }: { objects: CrisisSummary[] }) {
  const map = useMap();
  useEffect(() => {
    if (objects.length === 0) return;
    const bounds = L.latLngBounds(objects.map((c) => [c.lat, c.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [56, 56], maxZoom: 8 });
  }, [map, objects]);
  return null;
}

/**
 * Crisis-map overlay: a red impact radius around each point (sized by severity)
 * plus a marker at the centre. The selected point is outlined darker.
 */
export function CrisisLayer({
  objects,
  selectedId,
  onSelect,
}: {
  objects: CrisisSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      {objects.map((c) => {
        const isSelected = selectedId === c.id;
        return (
          <Fragment key={c.id}>
            <Circle
              center={[c.lat, c.lng]}
              radius={crisisRadius(c.severity)}
              pathOptions={{
                color: RED,
                weight: isSelected ? 2 : 1,
                opacity: isSelected ? 0.9 : 0.6,
                fillColor: RED,
                fillOpacity: crisisOpacity(c.severity),
              }}
              eventHandlers={{ click: () => onSelect(c.id) }}
            />
            <CircleMarker
              center={[c.lat, c.lng]}
              radius={isSelected ? 7 : 5}
              pathOptions={{ color: "#ffffff", weight: 2, fillColor: RED, fillOpacity: 1 }}
              eventHandlers={{ click: () => onSelect(c.id) }}
            >
              <Tooltip direction="top" offset={[0, -6]}>
                <div className="text-[11px] leading-tight">
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-neutral-500">{c.object_type} · {c.severity}</div>
                  <div className="text-neutral-400">{c.city} · {c.status}</div>
                </div>
              </Tooltip>
            </CircleMarker>
          </Fragment>
        );
      })}
      <FitToCrisis objects={objects} />
    </>
  );
}
