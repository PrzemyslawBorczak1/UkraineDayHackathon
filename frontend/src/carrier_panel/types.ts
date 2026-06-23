/** Types mirroring the carrier-panel backend DB models. */

export type PublicVerification = {
  company_registry_status: string;
  transport_licence_status: string;
  insurance_status: string;
  tax_arrears: string;
  sanctions_screening_result: string;
  registry_match_quality: string;
  incidents_24m: number;
  documentation_completeness_pct: number;
  public_verification_score: number;
  verification_result: string;  // "Approved" | "Manual review" | "Do not use"
  verification_notes: string | null;
};

export type Vehicle = {
  id: string;
  carrier_id: string;
  vehicle_type: string;
  gvw_t: number;
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
  gvw_t: number;
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
  name?: string;
  hq_city?: string;
  voivodeship?: string;
  activity_type?: string;
  operating_region?: string;
  preferred_contact_channel?: string;
  declared_activation_time_hours?: number;
  cost_per_km?: number;
};

export type CarrierProfile = {
  id: string;
  name: string;
  tax_id: string;
  hq_city: string;
  voivodeship: string;
  activity_type: string;
  declared_fleet_size: number;
  declared_warehouse_capacity_m2: number;
  crisis_participation_status: string;
  documentation_status: string;
  declared_activation_time_hours: number;
  reliability_score: number;
  risk_rating: string;       // "Low" | "Medium" | "High"
  cost_per_km: number;
  preferred_contact_channel: string;
  operating_region: string;
  vehicles: Vehicle[];
  warehouses: Warehouse[];
  verification: PublicVerification | null;
};

export type CarrierSummary = {
  id: string;
  name: string;
  tax_id: string;
  crisis_participation_status: string;
  risk_rating: string;
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

export type TaskSummary = {
  id: number;
  vehicle_id: string;
  mission_id: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  allocated_weight: number | null;
  allocated_volume: number | null;
};

export type Mission = {
  id: string;
  cargo_type: string;
  origin_point: string;
  destination_point: string;
  route_distance_km: number;
  weight_t: number;
  volume_m3: number;
  required_vehicle_type: string;
  priority: string;          // "Critical" | "High" | "Normal"
  available_from: string;    // ISO datetime
  deadline: string;          // ISO datetime
  estimated_cost: number;
  status: string;            // raw DB: NEW | ASSIGNED | IN_TRANSIT | DELIVERED | CLOSED | …
  requesting_authority: string;
  special_requirement: string | null;
  certificate_adr: boolean;
  liftgate: boolean;
  assigned_vehicle_id: string | null;
  assigned_carrier_id: string | null;
  assignment_score: number | null;
  origin_lat: number | null;
  origin_lng: number | null;
  dest_lat: number | null;
  dest_lng: number | null;
  acceptance_status: string; // "Pending" | "Accepted" | "Rejected"
  tasks: TaskSummary[];
};
