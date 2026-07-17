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

/** Uppercase + collapse spacing so "kda456u" and "KDA 456U" compare equal. */
export function normalizePlate(v: string): string {
  return v.trim().toUpperCase().replace(/\s+/g, " ");
}

// Kenyan registration formats (spacing optional):
//  - Standard civilian:  K + 2 letters + 3 digits + letter   (KDA 456U)
//  - Government:         GK + 3 digits + optional letter     (GK 123A)
//  - Special green:      KG/KC/KT + 3 digits + letter        (KG 123A)
//  - Trailers:           Z + 2 letters + 3 digits + letter   (ZC 1234 also seen)
//  - Diplomatic:         NN CD|UN NK                         (77 CD 1K)
const PLATE_PATTERNS = [
  /^K[A-Z]{2} ?\d{3}[A-Z]$/, //          standard (also covers KG/KC/KT + letter pairs)
  /^GK ?\d{3}[A-Z]?$/, //                government
  /^K[GCT] ?\d{3}[A-Z]?$/, //            dealers / containers / towing
  /^Z[A-Z]{1,2} ?\d{3,4}[A-Z]?$/, //     trailers
  /^\d{1,3} ?(CD|UN) ?\d{1,3}K$/, //     diplomatic
];

export function isValidKenyanPlate(v: string): boolean {
  const plate = normalizePlate(v);
  return PLATE_PATTERNS.some((re) => re.test(plate));
}

// Number/date fields arrive as strings from the form; parsed on the server.
export const carSchema = z.object({
  regNumber: z
    .string()
    .trim()
    .min(2, "Enter the registration")
    .max(20)
    .refine(isValidKenyanPlate, "Not a valid Kenyan plate (e.g. KDA 456U, GK 123A, 77 CD 1K)"),
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
  deposit: z.string().optional().default(""),
  imageUrl: z.string().trim().max(500).optional().default(""),
  ownerName: z.string().trim().max(80).optional().default(""),
  ownerPhone: z.string().trim().max(30).optional().default(""),
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
