import type { PaidPlan, Billing } from "@/features/billing/pricing";

/**
 * Paystack plan codes are static config, not data — no `plans` table exists in
 * this schema. Paystack Plans are per-interval, so a monthly and an annual tier
 * are *separate* plans: four codes total. Create them in the Paystack dashboard
 * (test mode first) and set these env vars. See PAYSTACK_INTEGRATION.md.
 */
const PLAN_CODES: Record<PaidPlan, Record<Billing, string | undefined>> = {
  PRO: {
    MONTHLY: process.env.PAYSTACK_PLAN_PRO_MONTHLY,
    ANNUAL: process.env.PAYSTACK_PLAN_PRO_ANNUAL,
  },
  BUSINESS: {
    MONTHLY: process.env.PAYSTACK_PLAN_BUSINESS_MONTHLY,
    ANNUAL: process.env.PAYSTACK_PLAN_BUSINESS_ANNUAL,
  },
};

/** The Paystack plan code for a plan + billing cycle, or undefined if unset. */
export function planCode(plan: PaidPlan, billing: Billing): string | undefined {
  return PLAN_CODES[plan]?.[billing];
}
