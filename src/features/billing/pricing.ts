import type { OrgPlan } from "@/lib/limits";

export type PaidPlan = Exclude<OrgPlan, "FREE">;
export type Billing = "MONTHLY" | "ANNUAL";

// Monthly list price per plan (USD). Annual bills 12 months at a 20% discount.
export const PLAN_MONTHLY: Record<PaidPlan, number> = { PRO: 35, BUSINESS: 69 };
export const ANNUAL_DISCOUNT = 0.2;

/** Amount charged today for the chosen plan + cycle (USD, major units). */
export function planAmount(plan: PaidPlan, billing: Billing): number {
  const monthly = PLAN_MONTHLY[plan];
  // Rounded to whole cents: e.g. Business annual = 69 × 12 × 0.8 = 662.40.
  return billing === "ANNUAL"
    ? Math.round(monthly * (1 - ANNUAL_DISCOUNT) * 12 * 100) / 100
    : monthly;
}
