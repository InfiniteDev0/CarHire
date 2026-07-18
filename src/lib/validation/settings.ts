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

/** Workspace → Operations: curfew + rate guardrails. */
export const orgOperationsSchema = z
  .object({
    curfewStart: timeField,
    curfewEnd: timeField,
    rateFloor: moneyField,
    rateCeiling: moneyField,
    refuelPenalty: moneyField,
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
  });
export type OrgOperationsInput = z.infer<typeof orgOperationsSchema>;
