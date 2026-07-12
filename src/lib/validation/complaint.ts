import { z } from "zod";

export const COMPLAINT_TYPES = [
  "MECHANICAL",
  "ACCIDENT",
  "BEHAVIOUR",
  "BILLING",
  "OTHER",
] as const;
export type ComplaintType = (typeof COMPLAINT_TYPES)[number];

export const COMPLAINT_TYPE_LABELS: Record<ComplaintType, string> = {
  MECHANICAL: "Mechanical breakdown",
  ACCIDENT: "Accident / damage",
  BEHAVIOUR: "Client behaviour",
  BILLING: "Billing / fuel dispute",
  OTHER: "Other",
};

export const complaintSchema = z
  .object({
    contractId: z.string().optional().default(""),
    carId: z.string().optional().default(""),
    type: z.enum(COMPLAINT_TYPES),
    description: z.string().trim().min(5, "Describe the incident").max(1000),
  })
  .refine((v) => v.contractId || v.carId, {
    message: "Link the complaint to a rental or a vehicle",
    path: ["carId"],
  });

export type ComplaintInput = z.infer<typeof complaintSchema>;
