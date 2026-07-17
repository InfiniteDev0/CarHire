import { z } from "zod";

/**
 * Kenyan mobile numbers: +254 then 7 or 1, then 8 digits. Accepts common ways
 * people type them (07XX…, 01XX…, 2547…, +254 7XX XXX XXX) and normalizes to
 * +2547XXXXXXXX / +2541XXXXXXXX.
 */
export function normalizeKenyanPhone(v: string): string | null {
  const digits = v.replace(/[\s\-()]/g, "");
  let rest: string | null = null;
  if (/^\+254[71]\d{8}$/.test(digits)) rest = digits.slice(4);
  else if (/^254[71]\d{8}$/.test(digits)) rest = digits.slice(3);
  else if (/^0[71]\d{8}$/.test(digits)) rest = digits.slice(1);
  else if (/^[71]\d{8}$/.test(digits)) rest = digits;
  return rest ? `+254${rest}` : null;
}

const kenyanPhone = (msg: string) =>
  z
    .string()
    .trim()
    .refine((v) => normalizeKenyanPhone(v) !== null, msg);

const optionalKenyanPhone = z
  .string()
  .trim()
  .refine((v) => v === "" || normalizeKenyanPhone(v) !== null, {
    message: "Use a Kenyan number: +254 7/1 followed by 8 digits",
  })
  .optional()
  .default("");

/**
 * Accepted identity documents:
 *  - Old ID (2nd gen): 8 digits            e.g. 12345678
 *  - Maisha Card UPI:  14 digits           e.g. 10000000000001
 *  - Alien card:       6–9 digits, may carry an F prefix  e.g. F1234567
 */
export function isValidKenyanId(v: string): boolean {
  const s = v.trim().toUpperCase();
  return /^\d{8}$/.test(s) || /^\d{14}$/.test(s) || /^F?\d{6,9}$/.test(s);
}

/** Smart DL numbers like DL-ABC1234 or IDL-AB0972 (prefix optional). */
export function isValidDlNumber(v: string): boolean {
  return /^(I?DL-)?[A-Z0-9]{5,12}$/i.test(v.trim());
}

export const nextOfKinSchema = z.object({
  name: z.string().trim().max(80),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || normalizeKenyanPhone(v) !== null, {
      message: "Next of kin phone must be a Kenyan number",
    }),
  relationship: z.string().trim().max(40),
});
export type NextOfKin = z.infer<typeof nextOfKinSchema>;

export const clientSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter the client's name").max(80),
    nationalId: z
      .string()
      .trim()
      .refine((v) => v === "" || isValidKenyanId(v), {
        message: "Use an 8-digit ID, 14-digit Maisha UPI, or a 6–9 digit alien card number",
      })
      .optional()
      .default(""),
    dlNumber: z
      .string()
      .trim()
      .refine((v) => v === "" || isValidDlNumber(v), {
        message: "Smart DL format, e.g. DL-ABC1234",
      })
      .optional()
      .default(""),
    phone: kenyanPhone("Kenyan number required: +254 7/1 followed by 8 digits"),
    secondaryPhone: optionalKenyanPhone,
    email: z
      .string()
      .trim()
      .regex(/^$|^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email")
      .optional()
      .default(""),
    address: z.string().trim().max(120).optional().default(""),
    nextOfKins: z.array(nextOfKinSchema).max(5).optional().default([]),
    notes: z.string().trim().max(500).optional().default(""),
  })
  .superRefine((v, ctx) => {
    const primary = normalizeKenyanPhone(v.phone);
    const secondary = v.secondaryPhone ? normalizeKenyanPhone(v.secondaryPhone) : null;
    if (primary && secondary && primary === secondary) {
      ctx.addIssue({
        code: "custom",
        path: ["secondaryPhone"],
        message: "Secondary phone can't be the same as the primary",
      });
    }
    for (const [i, kin] of v.nextOfKins.entries()) {
      if (kin.phone && !kin.name) {
        ctx.addIssue({
          code: "custom",
          path: ["nextOfKins", i, "name"],
          message: "Add the next of kin's name",
        });
      }
    }
  });

export type ClientInput = z.infer<typeof clientSchema>;
