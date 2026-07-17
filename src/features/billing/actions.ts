"use server";

import { createClient } from "@/lib/supabase/server";
import type { OrgPlan } from "@/lib/limits";

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
  return supabase;
}

/**
 * Activate a plan after checkout.
 *
 * NOTE: real charging is not wired yet — Card needs a Stripe/Paystack key,
 * M-Pesa needs Daraja (STK push) credentials, PayPal needs a client ID.
 * Until those keys exist, checkout completes as a simulated payment and the
 * plan activates immediately. The server action is the single place to swap
 * a real gateway call in.
 */
export async function activatePlan(
  orgId: string,
  plan: Exclude<OrgPlan, "FREE">,
  method: "CARD" | "MPESA" | "PAYPAL"
): Promise<void> {
  const supabase = await assertAdmin(orgId);

  if (!["PRO", "BUSINESS"].includes(plan)) throw new Error("Unknown plan.");
  if (!["CARD", "MPESA", "PAYPAL"].includes(method)) throw new Error("Unknown payment method.");

  const { error } = await supabase
    .from("organizations")
    .update({ plan, plan_activated_at: new Date().toISOString() })
    .eq("id", orgId);
  if (error) throw new Error(error.message);
}

/** Drop back to the Free plan (limits apply again immediately). */
export async function downgradeToFree(orgId: string): Promise<void> {
  const supabase = await assertAdmin(orgId);
  const { error } = await supabase
    .from("organizations")
    .update({ plan: "FREE", plan_activated_at: null })
    .eq("id", orgId);
  if (error) throw new Error(error.message);
}
