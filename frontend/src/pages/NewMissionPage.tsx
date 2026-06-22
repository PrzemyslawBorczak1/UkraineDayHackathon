import { type FormEvent, useState } from "react";
import { SectionLabel, CtaPill, cx } from "../components/ui";
import { CARGO_TYPES, VEHICLE_TYPES, PRIORITIES } from "../data/dispatch";
import { useCreateMission, type MissionCreatePayload } from "../hooks/useCreateMission";
import { toInputValue } from "../lib/time";

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
  origin_point: string;
  origin_lat: string;
  origin_lng: string;
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
  origin_point: "Kraków Hub 1",
  origin_lat: "50.0647",
  origin_lng: "19.9450",
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
  if (!f.origin_point.trim()) errors.origin_point = "Required";
  if (f.origin_lat === "" || isNaN(Number(f.origin_lat))) errors.origin_lat = "Valid number required";
  if (f.origin_lng === "" || isNaN(Number(f.origin_lng))) errors.origin_lng = "Valid number required";
  if (!f.destination_point.trim()) errors.destination_point = "Required";
  if (f.dest_lat === "" || isNaN(Number(f.dest_lat))) errors.dest_lat = "Valid number required";
  if (f.dest_lng === "" || isNaN(Number(f.dest_lng))) errors.dest_lng = "Valid number required";
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
      origin_point: form.origin_point,
      origin_lat: Number(form.origin_lat),
      origin_lng: Number(form.origin_lng),
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
              <Field label="Origin location" error={errors.origin_point}>
                <TextInput placeholder="e.g. Kraków Hub 1" value={form.origin_point} onChange={set("origin_point")} />
              </Field>
              <Field label="Route distance (km)" error={errors.route_distance_km}>
                <NumberInput placeholder="e.g. 450" value={form.route_distance_km} onChange={set("route_distance_km")} />
              </Field>
              <Field label="Origin lat" error={errors.origin_lat}>
                <NumberInput placeholder="50.0647" value={form.origin_lat} onChange={set("origin_lat")} />
              </Field>
              <Field label="Origin lng" error={errors.origin_lng}>
                <NumberInput placeholder="19.945" value={form.origin_lng} onChange={set("origin_lng")} />
              </Field>
              <Field label="Destination location" error={errors.destination_point}>
                <TextInput placeholder="e.g. Lviv Hub 1" value={form.destination_point} onChange={set("destination_point")} />
              </Field>
              <div /> {/* spacer */}
              <Field label="Destination lat" error={errors.dest_lat}>
                <NumberInput placeholder="49.8397" value={form.dest_lat} onChange={set("dest_lat")} />
              </Field>
              <Field label="Destination lng" error={errors.dest_lng}>
                <NumberInput placeholder="24.0297" value={form.dest_lng} onChange={set("dest_lng")} />
              </Field>
            </div>
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
