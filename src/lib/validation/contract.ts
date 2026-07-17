import { z } from "zod";

// Fuel gauge enum — matches the fuel_level Postgres enum. Order matters:
// index difference drives the refuel-penalty suggestion.
export const FUEL_LEVELS = ["EMPTY", "QUARTER", "HALF", "THREE_QUARTER", "FULL"] as const;
export type FuelLevel = (typeof FUEL_LEVELS)[number];

export const FUEL_LABELS: Record<FuelLevel, string> = {
  EMPTY: "E",
  QUARTER: "¼",
  HALF: "½",
  THREE_QUARTER: "¾",
  FULL: "F",
};

export const fuelIndex = (f: FuelLevel) => FUEL_LEVELS.indexOf(f);

// Suggested charge per missing fuel-gauge step at check-in (staff can adjust).
export const REFUEL_PENALTY_PER_LEVEL = 1500;

const intField = (msg: string) =>
  z.string().trim().regex(/^\d+$/, msg);

const optionalInt = z.string().trim().regex(/^$|^\d+$/, "Numbers only").optional().default("");

/** One authorized route leg — composed into the routing text server-side. */
export const routeLegSchema = z.object({
  from: z.string().trim().max(60),
  to: z.string().trim().max(60),
});
export type RouteLeg = z.infer<typeof routeLegSchema>;

export const composeRouting = (legs: RouteLeg[]) =>
  legs
    .filter((l) => l.from || l.to)
    .map((l) => `${l.from || "—"} → ${l.to || "—"}`)
    .join(", ");

export const createContractSchema = z
  .object({
    clientId: z.string().min(1, "Pick a client"),
    carId: z.string().min(1, "Pick a vehicle"),
    isSelfDrive: z.boolean(),
    driverName: z.string().trim().max(80).optional().default(""),
    driverDlNumber: z.string().trim().max(30).optional().default(""),
    driverDlExpiry: z.string().trim().optional().default(""), // YYYY-MM-DD
    durationDays: intField("Enter the rental days"),
    ratePerDay: z.string().trim().regex(/^\d+(\.\d{1,2})?$/, "Enter the daily rate"),
    depositAmount: z
      .string()
      .trim()
      .regex(/^\d+(\.\d{1,2})?$/, "Enter the deposit")
      .refine((v) => Number(v) > 0, "The pickup deposit is required"),
    routeLegs: z.array(routeLegSchema).max(5).optional().default([]),
    domicile: z.string().trim().max(60).optional().default(""),
  })
  .superRefine((v, ctx) => {
    if (Number(v.durationDays) < 1) {
      ctx.addIssue({ code: "custom", path: ["durationDays"], message: "At least 1 day" });
    }
    if (!v.isSelfDrive) {
      if (!v.driverName) {
        ctx.addIssue({ code: "custom", path: ["driverName"], message: "Enter the driver's name" });
      }
      if (!v.driverDlNumber) {
        ctx.addIssue({ code: "custom", path: ["driverDlNumber"], message: "Enter the DL number" });
      }
      if (!v.driverDlExpiry) {
        ctx.addIssue({ code: "custom", path: ["driverDlExpiry"], message: "Enter the DL expiry" });
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(v.driverDlExpiry) < today) {
          ctx.addIssue({
            code: "custom",
            path: ["driverDlExpiry"],
            message: "Driving licence has expired",
          });
        }
      }
    }
  });

export type CreateContractInput = z.infer<typeof createContractSchema>;

export const checkoutSchema = z.object({
  mileage: optionalInt,
  fuel: z.enum(FUEL_LEVELS),
  signature: z.string().trim().min(2, "Type the client's full name to confirm"),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const checkinSchema = z.object({
  returnedBy: z.string().trim().min(2, "Who returned the vehicle?"),
  mileage: optionalInt,
  fuel: z.enum(FUEL_LEVELS),
  refuelPenalty: z
    .string()
    .trim()
    .regex(/^$|^\d+(\.\d{1,2})?$/, "Enter a valid amount")
    .optional()
    .default(""),
});
export type CheckinInput = z.infer<typeof checkinSchema>;

export const extendSchema = z.object({
  extraDays: intField("How many extra days?").refine((v) => Number(v) >= 1, "At least 1 day"),
  // Money the client pays up-front to authorize the extension.
  amountPaid: z
    .string()
    .trim()
    .regex(/^$|^\d+(\.\d{1,2})?$/, "Enter a valid amount")
    .optional()
    .default(""),
  // Admin-adjustable required payment; non-admins are pinned to half the balance.
  requiredPayment: z
    .string()
    .trim()
    .regex(/^$|^\d+(\.\d{1,2})?$/, "Enter a valid amount")
    .optional()
    .default(""),
});
export type ExtendInput = z.infer<typeof extendSchema>;

export const paymentSchema = z.object({
  amount: z
    .string()
    .trim()
    .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount")
    .refine((v) => Number(v) > 0, "Amount must be positive"),
});
export type PaymentInput = z.infer<typeof paymentSchema>;
