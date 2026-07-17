import { z } from "zod";

export const EXPENSE_CATEGORIES = [
  "FUEL",
  "MAINTENANCE",
  "INSURANCE",
  "REPAIRS",
  "OTHER",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  FUEL: "Fuel",
  MAINTENANCE: "Maintenance / service",
  INSURANCE: "Insurance",
  REPAIRS: "Repairs",
  OTHER: "Other",
};

export const expenseSchema = z.object({
  carId: z.string().optional().default(""),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z
    .string()
    .trim()
    .refine((v) => v !== "" && !Number.isNaN(Number(v)) && Number(v) > 0, {
      message: "Enter an amount above zero",
    }),
  incurredOn: z.string().trim().min(1, "Pick a date"),
  note: z.string().trim().max(500, "Keep the note under 500 characters").optional().default(""),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
