/** Types mirroring the carrier-panel backend (app/carrier_panel/schemas.py). */

export type VerificationFields = {
  company_registry_status: string;
  transport_licence_status: string;
  insurance_status: string;
  tax_arrears: string;
  sanctions_screening_result: string;
  incidents_24m: number;
  documentation_completeness_pct: number;
  reliability_score: number;
};

export type Verification = {
  status: string; // "Approved" | "Manual review" | "Do not use"
  risk: string; // "Low" | "Medium" | "High"
  score: number;
  triggered_rules: string[];
  fields: VerificationFields;
};

export type Vehicle = {
  id: string;
  carrier_id: string;
  vehicle_type: string;
  gross_vehicle_weight_t: number;
  payload_t: number;
  volume_m3: number;
  temperature_controlled: boolean;
  adr_enabled: boolean;
  liftgate: boolean;
  current_city: string;
  availability_status: string;
  activation_time_hours: number;
  operational_range_km: number;
  restriction_note: string | null;
};

export type VehicleCreate = {
  vehicle_type: string;
  gross_vehicle_weight_t: number;
  payload_t: number;
  volume_m3: number;
  temperature_controlled: boolean;
  adr_enabled: boolean;
  liftgate: boolean;
  current_city: string;
  activation_time_hours: number;
  operational_range_km: number;
  restriction_note?: string | null;
};

export type Warehouse = {
  id: string;
  carrier_id: string;
  name: string;
  city: string;
  voivodeship: string;
  warehouse_type: string;
  area_m2: number;
  dock_doors: number;
  cold_storage: boolean;
  on_site_security: boolean;
  operating_hours: string;
  available_capacity_pct: number;
  availability_status: string;
  activation_time_hours: number;
};

export type WarehouseCreate = {
  name: string;
  city: string;
  voivodeship: string;
  warehouse_type: string;
  area_m2: number;
  dock_doors: number;
  cold_storage: boolean;
  on_site_security: boolean;
  operating_hours: string;
  available_capacity_pct: number;
  activation_time_hours: number;
};

export type CompanyUpdate = {
  name: string;
  hq_city: string;
  voivodeship: string;
  activity_type: string;
  operating_region: string;
  preferred_contact_channel: string;
  declared_activation_time_hours: number;
  cost_per_km: number;
};

export type CarrierProfile = {
  id: string;
  name: string;
  tax_id: string;
  hq_city: string;
  voivodeship: string;
  activity_type: string;
  operating_region: string;
  preferred_contact_channel: string;
  declared_activation_time_hours: number;
  cost_per_km: number;
  carrier_risk_rating: string | null;
  source: string; // "seed" | "registered"
  verification: Verification;
  vehicles: Vehicle[];
  warehouses: Warehouse[];
};

export type CarrierSummary = {
  id: string;
  name: string;
  tax_id: string;
  status: string;
  source: string;
};

export type Mission = {
  id: string;
  carrier_id: string;
  title: string;
  status: string;           // "Active" | "Upcoming" | "Completed"
  priority: string;         // "Critical" | "High" | "Normal"
  cargo_type: string;
  origin_city: string;
  destination_city: string;
  assigned_vehicle_ids: string[];
  assigned_warehouse_id: string | null;
  start_date: string;       // YYYY-MM-DD
  end_date: string;
  coordinator: string;
  distance_km: number;
  notes: string | null;
};

export type RegisterPayload = {
  name: string;
  tax_id: string;
  hq_city: string;
  voivodeship: string;
  activity_type: string;
  operating_region: string;
  preferred_contact_channel: string;
  declared_activation_time_hours: number;
  cost_per_km: number;
};
