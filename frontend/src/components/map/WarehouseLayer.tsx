import { useEffect } from "react";
import { CircleMarker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import type { WarehouseSummary } from "../../types";

/** Pans/zooms the map to fit the given warehouse points whenever they change. */
function FitBounds({ warehouses }: { warehouses: WarehouseSummary[] }) {
  const map = useMap();
  useEffect(() => {
    if (warehouses.length === 0) return;
    const bounds = L.latLngBounds(warehouses.map((w) => [w.lat, w.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 9 });
  }, [map, warehouses]);
  return null;
}

/**
 * Renders warehouse markers on the map. Markers belonging to the same carrier
 * share a color so fleets read as clusters at a glance.
 */
export function WarehouseLayer({
  warehouses,
  colors,
  selectedId,
  onSelect,
}: {
  warehouses: WarehouseSummary[];
  colors: Map<string, string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      {warehouses.map((w) => {
        const color = colors.get(w.carrier_id) ?? "#525252";
        const isSelected = selectedId === w.id;
        return (
          <CircleMarker
            key={w.id}
            center={[w.lat, w.lng]}
            radius={isSelected ? 10 : 7}
            pathOptions={{
              color: isSelected ? "#111827" : "#ffffff",
              weight: isSelected ? 3 : 2,
              fillColor: color,
              fillOpacity: 0.9,
            }}
            eventHandlers={{ click: () => onSelect(w.id) }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <div className="text-[11px] leading-tight">
                <div className="font-semibold">{w.name}</div>
                <div className="text-neutral-500">{w.city} · {w.voivodeship}</div>
                <div className="text-neutral-500">{w.warehouse_type} · {w.available_capacity_pct}% free</div>
                <div className="text-neutral-400">Carrier {w.carrier_id}</div>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
      <FitBounds warehouses={warehouses} />
    </>
  );
}
