"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { initializeTransaction, paystackConfigured } from "@/lib/paystack";
import { planAmount, type PaidPlan, type Billing } from "./pricing";

async function assertAdmin(orgId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be signed in.");

  const { data } = await supabase
    .from("org_members")
    .select("role, is_active")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data || data.role !== "admin" || !data.is_active) {
    throw new Error("Only admins can change the workspace plan.");
  }
  return { supabase, user };
}

/**
 * Start a Paystack checkout for a paid plan. Returns the hosted-checkout URL —
 * the client redirects there; Paystack handles card / M-Pesa / bank, then
 * bounces back to the verify route which activates the plan only on success.
 */
export async function initPaystackCheckout(
  orgId: string,
  plan: PaidPlan,
  billing: Billing
): Promise<{ authorizationUrl: string }> {
  const { user } = await assertAdmin(orgId);
  if (!["PRO", "BUSINESS"].includes(plan)) throw new Error("Unknown plan.");
  if (!paystackConfigured()) {
    throw new Error("Payments aren't set up yet — add your Paystack keys to enable checkout.");
  }
  if (!user.email) throw new Error("Your account has no email for the receipt.");

  const h = await headers();
  const origin = h.get("origin") ?? (h.get("host") ? `https://${h.get("host")}` : "");
  const callbackUrl = `${origin}/workspace/${orgId}/pricing/checkout/verify`;

  const { authorizationUrl } = await initializeTransaction({
    email: user.email,
    amount: planAmount(plan, billing),
    currency: "KES",
    callbackUrl,
    metadata: { orgId, plan, billing, userId: user.id },
  });

  return { authorizationUrl };
}

/** Drop back to the Free plan (limits apply again immediately). */
export async function downgradeToFree(orgId: string): Promise<void> {
  const { supabase } = await assertAdmin(orgId);
  const { error } = await supabase
    .from("organizations")
    .update({ plan: "FREE", plan_activated_at: null })
    .eq("id", orgId);
  if (error) throw new Error(error.message);
}
