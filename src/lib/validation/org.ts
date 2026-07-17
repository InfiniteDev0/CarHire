import { z } from "zod";

// Validates the onboarding payload on the server before inserting an org.
// Optional fields accept "" from the form and are normalised to null later.
export const createOrgSchema = z.object({
  name: z.string().trim().min(2, "Enter a business name").max(80),
  county: z.string().trim().max(60).optional().default(""),
  // Empty, or an E.164 number from the PhoneInput (e.g. +2547XXXXXXXX).
  phone: z
    .string()
    .trim()
    .regex(/^$|^\+\d{7,15}$/, "Enter a valid phone number")
    .optional()
    .default(""),
  fleetSize: z.string().nullable().optional(),
  inviteEmails: z.array(z.string().email()).max(10).default([]),
  curfewStart: z.string().optional().default(""),
  curfewEnd: z.string().optional().default(""),
  rateFloor: z.string().optional().default(""),
  rateCeiling: z.string().optional().default(""),
});

export type CreateOrgInput = z.infer<typeof createOrgSchema>;

/** Parse a money string to a number, or null when blank/invalid. */
export function toMoney(value: string): number | null {
  if (!value?.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
