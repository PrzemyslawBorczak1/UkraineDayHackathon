import type {
  CarrierProfile, CarrierSummary, RegisterPayload, CompanyUpdate,
  Vehicle, VehicleCreate, Warehouse, WarehouseCreate,
} from "./types";

// The carrier panel runs as its own backend on port 8001 (see
// app/carrier_panel/app.py). Override with VITE_CARRIER_API if needed.
const BASE =
  (import.meta as { env?: Record<string, string> }).env?.VITE_CARRIER_API ??
  "http://localhost:8001";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText} ${detail}`.trim());
  }
  return res.json() as Promise<T>;
}

export function listCarriers(): Promise<CarrierSummary[]> {
  return fetch(`${BASE}/api/carriers`).then((r) => json<CarrierSummary[]>(r));
}

export function getCarrier(id: string): Promise<CarrierProfile> {
  return fetch(`${BASE}/api/carriers/${id}`).then((r) => json<CarrierProfile>(r));
}

export function register(payload: RegisterPayload): Promise<CarrierProfile> {
  return fetch(`${BASE}/api/carriers/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then((r) => json<CarrierProfile>(r));
}

export function addVehicle(carrierId: string, payload: VehicleCreate): Promise<Vehicle> {
  return fetch(`${BASE}/api/carriers/${carrierId}/vehicles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then((r) => json<Vehicle>(r));
}

export function addWarehouse(carrierId: string, payload: WarehouseCreate): Promise<Warehouse> {
  return fetch(`${BASE}/api/carriers/${carrierId}/warehouses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then((r) => json<Warehouse>(r));
}

export function setVehicleAvailability(
  carrierId: string, vehicleId: string, status: string,
): Promise<Vehicle> {
  return fetch(`${BASE}/api/carriers/${carrierId}/vehicles/${vehicleId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ availability_status: status }),
  }).then((r) => json<Vehicle>(r));
}

export function updateVehicle(
  carrierId: string, vehicleId: string, payload: VehicleCreate,
): Promise<Vehicle> {
  return fetch(`${BASE}/api/carriers/${carrierId}/vehicles/${vehicleId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then((r) => json<Vehicle>(r));
}

export function updateWarehouse(
  carrierId: string, warehouseId: string, payload: WarehouseCreate,
): Promise<Warehouse> {
  return fetch(`${BASE}/api/carriers/${carrierId}/warehouses/${warehouseId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then((r) => json<Warehouse>(r));
}

export function updateCompany(carrierId: string, payload: CompanyUpdate): Promise<CarrierProfile> {
  return fetch(`${BASE}/api/carriers/${carrierId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).then((r) => json<CarrierProfile>(r));
}
