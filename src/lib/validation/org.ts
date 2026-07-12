import { z } from "zod";

// Validates the onboarding payload on the server before inserting an org.
// Optional fields accept "" from the form and are normalised to null later.
export const createOrgSchema = z.object({
  name: z.string().trim().min(2, "Enter a business name").max(80),
  county: z.string().trim().max(60).optional().default(""),
  // Empty, or 9 local digits (Kenya) starting with 7 or 1. +254 is added on save.
  phone: z
    .string()
    .trim()
    .regex(/^$|^[17]\d{8}$/, "Enter 9 digits starting with 7 or 1")
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
