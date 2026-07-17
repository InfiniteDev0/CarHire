import type { CarStatus } from "@/lib/validation/car";

export interface Vehicle {
  id: string;
  reg_number: string;
  make: string | null;
  model: string | null;
  year: number | null;
  capacity: number | null;
  status: CarStatus;
  county: string | null;
  domicile: string | null;
  color: string | null;
  body_type: string | null;
  transmission: string | null;
  fuel_type: string | null;
  engine: string | null;
  mileage: number | null;
  rate_per_day: number | null;
  deposit: number | null;
  image_url: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  num_owners: number | null;
  insurance_expiry: string | null;
  inspection_status: string | null;
  notes: string | null;
  created_by: string | null;
}

// Columns selected for the vehicles list / sheets.
export const VEHICLE_COLUMNS =
  "id, reg_number, make, model, year, capacity, status, county, domicile, color, body_type, transmission, fuel_type, engine, mileage, rate_per_day, deposit, image_url, owner_name, owner_phone, num_owners, insurance_expiry, inspection_status, notes, created_by";
