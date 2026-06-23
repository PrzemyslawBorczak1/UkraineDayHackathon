import { type FormEvent, useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { SectionLabel, CtaPill, cx } from "../components/ui";
import { CARGO_TYPES, VEHICLE_TYPES, PRIORITIES } from "../data/dispatch";
import { useCreateMission, type MissionCreatePayload } from "../hooks/useCreateMission";
import { useWarehouses } from "../hooks/useWarehouses";
import { toInputValue } from "../lib/time";

// ── Geoapify autocomplete ─────────────────────────────────────────────────

const GEOAPIFY_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY as string;

type GeoSuggestion = { label: string; lat: number; lon: number };

function useGeoapify(query: string) {
  const [suggestions, setSuggestions] = useState<GeoSuggestion[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.length < 3) { setSuggestions([]); return; }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&limit=5&apiKey=${GEOAPIFY_KEY}`;
        const res = await fetch(url);
        const json = await res.json();
        setSuggestions(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (json.features ?? []).map((f: any) => ({
            label: f.properties.formatted,
            lat: f.properties.lat,
            lon: f.properties.lon,
          }))
        );
      } catch { setSuggestions([]); }
    }, 300);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [query]);

  return { suggestions, clear: () => setSuggestions([]) };
}

function LocationInput({
  value,
  onChange,
  onResolve,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  onResolve: (lat: number, lon: number) => void;
  placeholder?: string;
}) {
  const { suggestions, clear } = useGeoapify(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setOpen(suggestions.length > 0); }, [suggestions]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputCls}
        autoComplete="off"
      />
      {open && (
        <ul className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden text-sm">
          {suggestions.map((s) => (
            <li
              key={`${s.lat}-${s.lon}`}
              className="px-3 py-2 cursor-pointer hover:bg-neutral-100 truncate"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(s.label);
                onResolve(s.lat, s.lon);
                clear();
                setOpen(false);
              }}
            >
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Route map preview ────────────────────────────────────────────────────

const markerIcon = (color: string) =>
  L.divIcon({
    className: "",
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 2) {
      map.fitBounds(L.latLngBounds(positions), { padding: [32, 32] });
    } else if (positions.length === 1) {
      map.setView(positions[0], 10);
    }
  }, [map, positions]);
  return null;
}

function RouteMap({ originLat, originLng, destLat, destLng }: { originLat: string; originLng: string; destLat: string; destLng: string }) {
  const oLat = parseFloat(originLat), oLng = parseFloat(originLng);
  const dLat = parseFloat(destLat), dLng = parseFloat(destLng);
  const hasOrigin = !isNaN(oLat) && !isNaN(oLng);
  const hasDest = !isNaN(dLat) && !isNaN(dLng);
  const positions: [number, number][] = [
    ...(hasOrigin ? [[oLat, oLng] as [number, number]] : []),
    ...(hasDest ? [[dLat, dLng] as [number, number]] : []),
  ];

  return (
    <MapContainer
      center={positions[0] ?? [50.06, 19.94]}
      zoom={6}
      scrollWheelZoom={false}
      className="w-full h-56 rounded-xl z-0"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {hasOrigin && <Marker position={[oLat, oLng]} icon={markerIcon("#10b981")} />}
      {hasDest && <Marker position={[dLat, dLng]} icon={markerIcon("#ef4444")} />}
      {hasOrigin && hasDest && (
        <Polyline positions={[[oLat, oLng], [dLat, dLng]]} color="#6366f1" weight={2} dashArray="6 4" />
      )}
      <FitBounds positions={positions} />
    </MapContainer>
  );
}

// ── Reusable field wrappers ────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <SectionLabel>{label}</SectionLabel>
      {children}
      {error && <p className="text-[11px] text-rose-500">{error}</p>}
    </div>
  );
}

const inputCls = cx(
  "w-full px-3 py-2 bg-neutral-100 rounded-lg text-sm border border-transparent",
  "focus:border-neutral-300 focus:bg-white outline-none transition-all"
);

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputCls, props.className)} />;
}

function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="number" step="any" min="0" {...props} className={cx(inputCls, props.className)} />;
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { options: readonly string[] }) {
  const { options, ...rest } = props;
  return (
    <select {...rest} className={cx(inputCls, "cursor-pointer", rest.className)}>
      <option value="">Select…</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );
}

function DateTimeInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="datetime-local" {...props} className={cx(inputCls, "kord-datetime cursor-pointer", props.className)} />;
}

// ── Form state ─────────────────────────────────────────────────────────────

type FormState = {
  cargo_type: string;
  origin_warehouse_id: string;
  destination_point: string;
  dest_lat: string;
  dest_lng: string;
  route_distance_km: string;
  weight_t: string;
  volume_m3: string;
  required_vehicle_type: string;
  priority: string;
  available_from: string;
  deadline: string;
  estimated_cost: string;
  requesting_authority: string;
  special_requirement: string;
};

const EMPTY: FormState = {
  cargo_type: "Medical supplies",
  origin_warehouse_id: "",
  destination_point: "Lviv Hub 1",
  dest_lat: "49.8397",
  dest_lng: "24.0297",
  route_distance_km: "450",
  weight_t: "12.5",
  volume_m3: "30",
  required_vehicle_type: "Standard semi",
  priority: "High",
  available_from: toInputValue(new Date()),
  deadline: toInputValue(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
  estimated_cost: "12000",
  requesting_authority: "Centrum Zarządzania Kryzysowego",
  special_requirement: "",
};

type Errors = Partial<Record<keyof FormState, string>>;

function validate(f: FormState): Errors {
  const errors: Errors = {};
  if (!f.cargo_type) errors.cargo_type = "Required";
  if (!f.origin_warehouse_id) errors.origin_warehouse_id = "Select an origin warehouse";
  if (!f.destination_point.trim()) errors.destination_point = "Required";
  else if (f.dest_lat === "" || isNaN(Number(f.dest_lat)) || f.dest_lng === "" || isNaN(Number(f.dest_lng)))
    errors.destination_point = "Select a location from the dropdown";
  if (!f.route_distance_km || Number(f.route_distance_km) <= 0) errors.route_distance_km = "Must be > 0";
  if (!f.weight_t || Number(f.weight_t) <= 0) errors.weight_t = "Must be > 0";
  if (!f.volume_m3 || Number(f.volume_m3) <= 0) errors.volume_m3 = "Must be > 0";
  if (!f.required_vehicle_type) errors.required_vehicle_type = "Required";
  if (!f.priority) errors.priority = "Required";
  if (!f.available_from) errors.available_from = "Required";
  if (!f.deadline) errors.deadline = "Required";
  if (!f.estimated_cost || Number(f.estimated_cost) < 0) errors.estimated_cost = "Must be ≥ 0";
  if (!f.requesting_authority.trim()) errors.requesting_authority = "Required";
  return errors;
}

// ── Page ──────────────────────────────────────────────────────────────────

export function NewMissionPage({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const { state, create, reset } = useCreateMission();
  const { data: warehouses } = useWarehouses();
  const originWh = warehouses.find((w) => w.id === form.origin_warehouse_id);

  const set = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    const payload: MissionCreatePayload = {
      cargo_type: form.cargo_type,
      origin_warehouse_id: form.origin_warehouse_id,
      destination_point: form.destination_point,
      dest_lat: Number(form.dest_lat),
      dest_lng: Number(form.dest_lng),
      route_distance_km: Math.round(Number(form.route_distance_km)),
      weight_t: Number(form.weight_t),
      volume_m3: Number(form.volume_m3),
      required_vehicle_type: form.required_vehicle_type,
      priority: form.priority,
      available_from: new Date(form.available_from).toISOString(),
      deadline: new Date(form.deadline).toISOString(),
      estimated_cost: Number(form.estimated_cost),
      requesting_authority: form.requesting_authority,
      special_requirement: form.special_requirement || undefined,
    };

    await create(payload);
  };

  if (state.status === "success") {
    return (
      <div className="flex h-screen w-full bg-[#fafafa] font-sans items-center justify-center">
        <div className="text-center space-y-4">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100">
            <span className="size-3 rounded-full bg-emerald-500" />
          </span>
          <h2 className="text-xl font-semibold tracking-tight">Mission created</h2>
          <p className="text-sm text-neutral-500 tabular-nums">ID: {state.id}</p>
          <div className="flex gap-3 justify-center pt-2">
            <CtaPill variant="ghost" onClick={() => { reset(); setForm(EMPTY); }}>
              + Create another
            </CtaPill>
            <CtaPill onClick={onBack}>← Back to dispatch</CtaPill>
          </div>
        </div>
      </div>
    );
  }

  const isLoading = state.status === "loading";

  return (
    <div className="flex h-screen w-full bg-[#fafafa] font-sans overflow-hidden">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-8 py-4 bg-white border-b border-neutral-200">
        <div>
          <SectionLabel>New Mission</SectionLabel>
          <h1 className="mt-1 text-lg font-semibold tracking-tight">Create mission</h1>
        </div>
        <button onClick={onBack} className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
          ← Back to dispatch
        </button>
      </div>

      {/* Scrollable form body */}
      <div className="flex-1 overflow-y-auto pt-20 pb-12 px-8">
        <form onSubmit={handleSubmit} noValidate className="max-w-3xl mx-auto space-y-10 py-8">

          {/* Cargo */}
          <section className="space-y-5">
            <SectionLabel>Cargo</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Cargo type" error={errors.cargo_type}>
                <Select options={CARGO_TYPES} value={form.cargo_type} onChange={set("cargo_type")} />
              </Field>
              <Field label="Required vehicle type" error={errors.required_vehicle_type}>
                <Select options={VEHICLE_TYPES} value={form.required_vehicle_type} onChange={set("required_vehicle_type")} />
              </Field>
              <Field label="Weight (t)" error={errors.weight_t}>
                <NumberInput placeholder="e.g. 12.5" value={form.weight_t} onChange={set("weight_t")} />
              </Field>
              <Field label="Volume (m³)" error={errors.volume_m3}>
                <NumberInput placeholder="e.g. 30" value={form.volume_m3} onChange={set("volume_m3")} />
              </Field>
            </div>
          </section>

          {/* Route */}
          <section className="space-y-5">
            <SectionLabel>Route</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Origin warehouse" error={errors.origin_warehouse_id}>
                <select
                  value={form.origin_warehouse_id}
                  onChange={set("origin_warehouse_id")}
                  className={inputCls}
                >
                  <option value="">Select warehouse…</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} — {w.city}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Route distance (km)" error={errors.route_distance_km}>
                <NumberInput placeholder="e.g. 450" value={form.route_distance_km} onChange={set("route_distance_km")} />
              </Field>
              <Field label="Destination location" error={errors.destination_point}>
                <LocationInput
                  value={form.destination_point}
                  onChange={(v) => setForm((p) => ({ ...p, destination_point: v }))}
                  onResolve={(lat, lon) => setForm((p) => ({ ...p, dest_lat: String(lat), dest_lng: String(lon) }))}
                  placeholder="e.g. Lviv Hub 1"
                />
              </Field>
            </div>
            <RouteMap
              originLat={originWh ? String(originWh.lat) : ""}
              originLng={originWh ? String(originWh.lng) : ""}
              destLat={form.dest_lat}
              destLng={form.dest_lng}
            />
          </section>

          {/* Scheduling & priority */}
          <section className="space-y-5">
            <SectionLabel>Scheduling & priority</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Available from" error={errors.available_from}>
                <DateTimeInput value={form.available_from} onChange={set("available_from")} />
              </Field>
              <Field label="Deadline" error={errors.deadline}>
                <DateTimeInput value={form.deadline} onChange={set("deadline")} />
              </Field>
              <Field label="Priority" error={errors.priority}>
                <Select options={PRIORITIES} value={form.priority} onChange={set("priority")} />
              </Field>
              <Field label="Estimated cost (PLN)" error={errors.estimated_cost}>
                <NumberInput placeholder="e.g. 12000" value={form.estimated_cost} onChange={set("estimated_cost")} />
              </Field>
            </div>
          </section>

          {/* Authority & notes */}
          <section className="space-y-5">
            <SectionLabel>Authority & notes</SectionLabel>
            <div className="grid grid-cols-1 gap-4">
              <Field label="Requesting authority" error={errors.requesting_authority}>
                <TextInput placeholder="e.g. Centrum Zarządzania Kryzysowego" value={form.requesting_authority} onChange={set("requesting_authority")} />
              </Field>
              <Field label="Special requirement (optional)">
                <textarea
                  rows={3}
                  placeholder="e.g. temperature 2-8°C, ADR certificate required"
                  value={form.special_requirement}
                  onChange={set("special_requirement")}
                  className={cx(inputCls, "resize-none")}
                />
              </Field>
            </div>
          </section>

          {/* Error banner */}
          {state.status === "error" && (
            <div className="rounded-xl bg-rose-50 ring-1 ring-rose-200 px-4 py-3 text-sm text-rose-600">
              {state.message}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <CtaPill variant="ghost" onClick={onBack} className={isLoading ? "pointer-events-none opacity-50" : ""}>
              Cancel
            </CtaPill>
            <CtaPill className={isLoading ? "opacity-50 pointer-events-none" : ""}>
              {isLoading ? "Creating…" : "Create mission"}
            </CtaPill>
          </div>
        </form>
      </div>
    </div>
  );
}
