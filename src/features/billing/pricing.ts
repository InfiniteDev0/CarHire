import type { OrgPlan } from "@/lib/limits";

export type PaidPlan = Exclude<OrgPlan, "FREE">;
export type Billing = "MONTHLY" | "ANNUAL";

// Monthly list price per plan (KES). Annual bills 12 months at a 20% discount.
export const PLAN_MONTHLY: Record<PaidPlan, number> = { PRO: 2500, BUSINESS: 6000 };
export const ANNUAL_DISCOUNT = 0.2;

/** Amount charged today for the chosen plan + cycle (KES, major units). */
export function planAmount(plan: PaidPlan, billing: Billing): number {
  const monthly = PLAN_MONTHLY[plan];
  return billing === "ANNUAL" ? Math.round(monthly * (1 - ANNUAL_DISCOUNT) * 12) : monthly;
}
