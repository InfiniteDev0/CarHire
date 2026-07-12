import { z } from "zod";

// Password policy — kept in sync with the strength meter in the signup form.
// Min 8 chars, at least one lowercase, one uppercase, one number.
export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[0-9]/, "Add a number");

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Enter a valid email");

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const forgotSchema = z.object({
  email: emailSchema,
});

export const resetSchema = z.object({
  password: passwordSchema,
});

/**
 * Validate `values` against a schema. Returns a plain field→message map
 * ({} when valid) so form components stay decoupled from Zod internals.
 * Uses `issues` (Zod v4) rather than the deprecated `.flatten()`.
 */
export function validate(
  schema: z.ZodType,
  values: unknown
): Record<string, string> {
  const result = schema.safeParse(values);
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors;
}
