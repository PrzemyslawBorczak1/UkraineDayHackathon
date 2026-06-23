import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Mission, TaskSummary } from "./types";

// Layout constants — keep bars perfectly aligned across all rows
const COL_LABEL = 64;  // px, vehicle id
const COL_BADGE = 88;  // px, status badge

type LatLng = [number, number];

const TASK_COLOR: Record<string, string> = {
  Traveling:     "#3b82f6",
  Transporting:  "#10b981",
  PrepareUnload: "#f59e0b",
  Unload:        "#f97316",
  Wait:          "#94a3b8",
};

const TASK_LABEL: Record<string, string> = {
  Traveling:     "Driving (empty)",
  Transporting:  "Transporting cargo",
  PrepareUnload: "Preparing unload",
  Unload:        "Unloading",
  Wait:          "Waiting",
};

// Module-level OSRM cache shared with the operator panel hook
const routeCache = new Map<string, LatLng[]>();

async function fetchRoute(origin: LatLng, dest: LatLng): Promise<LatLng[]> {
  const key = `${origin[1]},${origin[0]};${dest[1]},${dest[0]}`;
  if (routeCache.has(key)) return routeCache.get(key)!;
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${key}?overview=full&geometries=geojson`
    );
    const data = await res.json();
    if (data.code === "Ok" && data.routes?.[0]) {
      const coords: LatLng[] = data.routes[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng] as LatLng
      );
      routeCache.set(key, coords);
      return coords;
    }
  } catch { /* fall through */ }
  const fallback: LatLng[] = [origin, dest];
  routeCache.set(key, fallback);
  return fallback;
}

function durLabel(start: string | null, end: string | null): string {
  if (!start || !end) return "";
  const h = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 3_600_000);
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d ${h % 24}h`;
}

function TaskDetail({ t }: { t: TaskSummary }) {
  const color = TASK_COLOR[t.status] ?? "#94a3b8";
  const dur = durLabel(t.start_date, t.end_date);
  return (
    <div style={{
      margin: "4px 0 6px",
      padding: "8px 12px",
      borderRadius: 6,
      background: color + "11",
      border: `1px solid ${color}33`,
      fontSize: 12,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "4px 16px",
    }}>
      <div><span style={{ color: "var(--cp-faint)" }}>Start </span><strong>{fmtShort(t.start_date)}</strong></div>
      <div><span style={{ color: "var(--cp-faint)" }}>End </span><strong>{fmtShort(t.end_date)}</strong></div>
      {dur && <div><span style={{ color: "var(--cp-faint)" }}>Duration </span><strong>{dur}</strong></div>}
      {t.allocated_weight != null && <div><span style={{ color: "var(--cp-faint)" }}>Weight </span><strong>{t.allocated_weight.toFixed(1)} t</strong></div>}
      {t.allocated_volume != null && <div><span style={{ color: "var(--cp-faint)" }}>Volume </span><strong>{t.allocated_volume.toFixed(1)} m³</strong></div>}
      <div style={{ gridColumn: "1 / -1" }}><span style={{ color: "var(--cp-faint)" }}>Phase </span><strong style={{ color }}>{TASK_LABEL[t.status] ?? t.status}</strong></div>
    </div>
  );
}

function TaskTimeline({ tasks }: { tasks: TaskSummary[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const withDates = tasks.filter((t) => t.start_date && t.end_date);

  if (withDates.length === 0) {
    if (tasks.length === 0) return null;
    return (
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
        {tasks.map((t) => (
          <span key={t.id} style={{
            fontSize: 11, padding: "2px 8px", borderRadius: 99,
            background: (TASK_COLOR[t.status] ?? "#94a3b8") + "22",
            color: TASK_COLOR[t.status] ?? "#94a3b8",
            border: `1px solid ${TASK_COLOR[t.status] ?? "#94a3b8"}44`,
            fontWeight: 600,
          }}>
            {t.vehicle_id} · {t.status}
          </span>
        ))}
      </div>
    );
  }

  const minMs = Math.min(...withDates.map((t) => new Date(t.start_date!).getTime()));
  const maxMs = Math.max(...withDates.map((t) => new Date(t.end_date!).getTime()));
  const span = maxMs - minMs || 1;
  const nowMs = Date.now();

  const gridRow = `${COL_LABEL}px 1fr ${COL_BADGE}px`;

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--cp-faint)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
        Mission timeline
      </div>

      {withDates.map((t) => {
        const start = new Date(t.start_date!).getTime();
        const end = new Date(t.end_date!).getTime();
        const left = ((start - minMs) / span) * 100;
        const width = Math.max(((end - start) / span) * 100, 1.5);
        const color = TASK_COLOR[t.status] ?? "#94a3b8";
        const isActive = nowMs >= start && nowMs <= end;
        const isSelected = selectedId === t.id;

        return (
          <div key={t.id}>
            {/* Row — fixed grid so all bars align */}
            <div
              onClick={() => setSelectedId(isSelected ? null : t.id)}
              style={{
                display: "grid",
                gridTemplateColumns: gridRow,
                alignItems: "center",
                gap: 8,
                marginBottom: 3,
                cursor: "pointer",
                borderRadius: 4,
                padding: "1px 0",
                background: isSelected ? color + "0d" : "transparent",
              }}
            >
              <span style={{
                fontSize: 10, fontFamily: "monospace", color: isSelected ? color : "var(--cp-faint)",
                textAlign: "right", fontWeight: isSelected ? 700 : 400,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {t.vehicle_id}
              </span>

              <div style={{ position: "relative", height: 18, background: "#f1f5f9", borderRadius: 4 }}>
                <div style={{
                  position: "absolute", top: 2, bottom: 2,
                  left: `${left}%`, width: `${width}%`,
                  background: color,
                  borderRadius: 3,
                  opacity: isActive ? 1 : isSelected ? 0.9 : 0.65,
                  boxShadow: isSelected ? `0 0 0 2px ${color}55` : isActive ? `0 0 0 1px ${color}44` : "none",
                  transition: "opacity 0.15s, box-shadow 0.15s",
                }} />
                {nowMs >= minMs && nowMs <= maxMs && (
                  <div style={{
                    position: "absolute", top: 0, bottom: 0,
                    left: `${((nowMs - minMs) / span) * 100}%`,
                    width: 2, background: "#ef4444", borderRadius: 1, zIndex: 2,
                  }} />
                )}
              </div>

              <div style={{
                fontSize: 10, padding: "1px 0", borderRadius: 99,
                background: isSelected ? color + "22" : color + "11",
                color, fontWeight: 600, textAlign: "center",
                border: `1px solid ${color}${isSelected ? "55" : "33"}`,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {t.status}
              </div>
            </div>

            {isSelected && <TaskDetail t={t} />}
          </div>
        );
      })}

      {/* Time axis */}
      <div style={{
        display: "grid",
        gridTemplateColumns: gridRow,
        gap: 8,
        marginTop: 2,
      }}>
        <div />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 10, color: "var(--cp-faint)" }}>{fmtShort(withDates[0].start_date)}</span>
          <span style={{ fontSize: 10, color: "var(--cp-faint)" }}>{fmtShort(withDates[withDates.length - 1].end_date)}</span>
        </div>
        <div />
      </div>
    </div>
  );
}

function fmtShort(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) +
    " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function RoutePolyline({ origin, dest }: { origin: LatLng; dest: LatLng }) {
  const [route, setRoute] = useState<LatLng[]>([origin, dest]);

  useEffect(() => {
    let cancelled = false;
    fetchRoute(origin, dest).then((r) => { if (!cancelled) setRoute(r); });
    return () => { cancelled = true; };
  }, [origin[0], origin[1], dest[0], dest[1]]);

  return (
    <Polyline
      positions={route}
      pathOptions={{ color: "#6366f1", weight: 3, opacity: 0.8 }}
    />
  );
}

export function MissionRouteMap({ mission }: { mission: Mission }) {
  const { origin_lat, origin_lng, dest_lat, dest_lng, tasks } = mission;
  const mapRef = useRef<HTMLDivElement>(null);

  if (!origin_lat || !origin_lng || !dest_lat || !dest_lng) {
    return <TaskTimeline tasks={tasks} />;
  }

  const origin: LatLng = [origin_lat, origin_lng];
  const dest: LatLng = [dest_lat, dest_lng];
  const center: LatLng = [(origin_lat + dest_lat) / 2, (origin_lng + dest_lng) / 2];

  return (
    <div style={{ marginTop: 12, borderTop: "1px solid var(--cp-line, #e7e9ee)", paddingTop: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--cp-faint)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
        Route map
      </div>

      <div ref={mapRef} style={{ height: 180, borderRadius: 8, overflow: "hidden", border: "1px solid var(--cp-line, #e7e9ee)" }}>
        <MapContainer
          center={center}
          zoom={6}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          attributionControl={false}
          scrollWheelZoom={false}
          dragging={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <RoutePolyline origin={origin} dest={dest} />

          {/* Origin */}
          <CircleMarker center={origin} radius={6}
            pathOptions={{ color: "#fff", weight: 2, fillColor: "#1d4ed8", fillOpacity: 1 }}>
            <Tooltip permanent direction="top" offset={[0, -8]}>
              <span style={{ fontSize: 11 }}>{mission.origin_point}</span>
            </Tooltip>
          </CircleMarker>

          {/* Destination */}
          <CircleMarker center={dest} radius={6}
            pathOptions={{ color: "#fff", weight: 2, fillColor: "#10b981", fillOpacity: 1 }}>
            <Tooltip permanent direction="top" offset={[0, -8]}>
              <span style={{ fontSize: 11 }}>{mission.destination_point}</span>
            </Tooltip>
          </CircleMarker>
        </MapContainer>
      </div>

      <TaskTimeline tasks={tasks} />
    </div>
  );
}
