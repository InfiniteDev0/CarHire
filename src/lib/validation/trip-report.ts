import { z } from "zod";

export const CAR_RETURN_CONDITIONS = [
  "EXCELLENT",
  "GOOD",
  "MINOR_ISSUES",
  "DAMAGED",
] as const;
export type CarReturnCondition = (typeof CAR_RETURN_CONDITIONS)[number];

export const CAR_RETURN_CONDITION_LABELS: Record<CarReturnCondition, string> = {
  EXCELLENT: "Excellent — like it left",
  GOOD: "Good — normal wear",
  MINOR_ISSUES: "Minor issues",
  DAMAGED: "Damaged",
};

export const tripReportSchema = z
  .object({
    carCondition: z.enum(CAR_RETURN_CONDITIONS),
    clientRating: z
      .string()
      .trim()
      .regex(/^[1-5]$/, "Rate the client 1–5"),
    performance: z.string().trim().max(1000).optional().default(""),
    damages: z.string().trim().max(1000).optional().default(""),
    damagePlan: z.string().trim().max(1000).optional().default(""),
  })
  .superRefine((v, ctx) => {
    if (v.carCondition === "DAMAGED" && !v.damages) {
      ctx.addIssue({
        code: "custom",
        path: ["damages"],
        message: "Describe the damage",
      });
    }
    if (v.carCondition === "DAMAGED" && !v.damagePlan) {
      ctx.addIssue({
        code: "custom",
        path: ["damagePlan"],
        message: "How will the damage be dealt with?",
      });
    }
  });

export type TripReportInput = z.infer<typeof tripReportSchema>;
