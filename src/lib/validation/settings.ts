import { z } from "zod";

const timeField = z
  .string()
  .trim()
  .regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h)")
  .optional()
  .default("");

const moneyField = z
  .string()
  .trim()
  .regex(/^$|^\d+(\.\d{1,2})?$/, "Enter a valid amount")
  .optional()
  .default("");

/** Workspace → General: identity fields. */
export const orgGeneralSchema = z.object({
  name: z.string().trim().min(2, "Enter the business name").max(80),
  phone: z.string().trim().max(30).optional().default(""),
  county: z.string().trim().max(60).optional().default(""),
});
export type OrgGeneralInput = z.infer<typeof orgGeneralSchema>;

/** Workspace → Operations: curfew + rate guardrails + concurrent-rental policy. */
export const orgOperationsSchema = z
  .object({
    curfewStart: timeField,
    curfewEnd: timeField,
    rateFloor: moneyField,
    rateCeiling: moneyField,
    refuelPenalty: moneyField,
    // Let a single client hold more than one rental at a time.
    allowMultipleRentals: z.boolean().optional().default(false),
    // Cap when the above is on (whole number).
    maxConcurrentRentals: z
      .string()
      .trim()
      .regex(/^$|^\d+$/, "Whole number")
      .optional()
      .default(""),
  })
  .superRefine((v, ctx) => {
    if ((v.curfewStart && !v.curfewEnd) || (!v.curfewStart && v.curfewEnd)) {
      ctx.addIssue({
        code: "custom",
        path: ["curfewEnd"],
        message: "Set both curfew times, or leave both empty",
      });
    }
    if (v.rateFloor && v.rateCeiling && Number(v.rateCeiling) < Number(v.rateFloor)) {
      ctx.addIssue({
        code: "custom",
        path: ["rateCeiling"],
        message: "Ceiling must be at least the floor",
      });
    }
    if (v.allowMultipleRentals && v.maxConcurrentRentals && Number(v.maxConcurrentRentals) < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["maxConcurrentRentals"],
        message: "Allow at least 2 vehicles when multiple rentals are on",
      });
    }
  });
export type OrgOperationsInput = z.infer<typeof orgOperationsSchema>;
