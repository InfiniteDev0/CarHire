import { z } from "zod";

// KYC per the research spec: name + primary phone required; the rest optional
// for MVP so staff can capture walk-ins fast and complete the profile later.
export const clientSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the client's name").max(80),
  nationalId: z.string().trim().max(20).optional().default(""),
  kraPin: z.string().trim().max(20).optional().default(""),
  phone: z.string().trim().min(7, "Enter the primary phone").max(30),
  secondaryPhone: z.string().trim().max(30).optional().default(""),
  email: z
    .string()
    .trim()
    .regex(/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email")
    .optional()
    .default(""),
  address: z.string().trim().max(120).optional().default(""),
  nokName: z.string().trim().max(80).optional().default(""),
  nokPhone: z.string().trim().max(30).optional().default(""),
  notes: z.string().trim().max(500).optional().default(""),
});

export type ClientInput = z.infer<typeof clientSchema>;
