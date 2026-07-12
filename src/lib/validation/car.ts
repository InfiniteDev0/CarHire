import { z } from "zod";

export const CAR_STATUSES = ["AVAILABLE", "TRIP", "MAINTENANCE"] as const;
export type CarStatus = (typeof CAR_STATUSES)[number];

// Classification option lists — shared by the form selects and the filters.
export const BODY_TYPES = [
  "Sedan",
  "Coupe",
  "Hatchback",
  "Wagon",
  "Pickup",
  "Crossover",
  "SUV",
  "Van",
  "Sport coupe",
] as const;

export const TRANSMISSIONS = ["Automatic", "Manual"] as const;

export const FUEL_TYPES = [
  "Petrol",
  "Diesel",
  "Hybrid",
  "Electric",
  "Flex Fuel",
  "Hydrogen",
  "Other",
] as const;

export const INSPECTION_STATUSES = ["Compliant", "Due", "Expired"] as const;

// Number/date fields arrive as strings from the form; parsed on the server.
export const carSchema = z.object({
  regNumber: z.string().trim().min(2, "Enter the registration").max(20),
  make: z.string().trim().min(1, "Enter the make").max(40),
  model: z.string().trim().min(1, "Enter the model").max(40),
  year: z.string().optional().default(""),
  capacity: z.string().optional().default(""),
  status: z.enum(CAR_STATUSES),
  county: z.string().trim().max(60).optional().default(""),
  domicile: z.string().trim().max(60).optional().default(""),
  color: z.string().trim().max(30).optional().default(""),
  bodyType: z.string().trim().max(30).optional().default(""),
  transmission: z.string().trim().max(30).optional().default(""),
  fuelType: z.string().trim().max(30).optional().default(""),
  engine: z.string().trim().max(60).optional().default(""),
  mileage: z.string().optional().default(""),
  ratePerDay: z.string().optional().default(""),
  imageUrl: z.string().trim().max(500).optional().default(""),
  ownerName: z.string().trim().max(80).optional().default(""),
  numOwners: z.string().optional().default(""),
  insuranceExpiry: z.string().optional().default(""), // YYYY-MM-DD
  inspectionStatus: z.string().trim().max(30).optional().default(""),
  notes: z.string().trim().max(500).optional().default(""),
});

export type CarInput = z.infer<typeof carSchema>;

export function toInt(v: string): number | null {
  if (!v?.trim()) return null;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

export function toMoney(v: string): number | null {
  if (!v?.trim()) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
