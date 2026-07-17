import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyTransaction } from "@/lib/paystack";
import type { OrgPlan } from "@/lib/limits";

/**
 * Paystack redirects here after payment (…/checkout/verify?reference=…).
 * We verify server-side and only then activate the plan, so the client can't
 * grant itself Pro by hitting an endpoint. Always redirects back to /pricing.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params;
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference") ?? url.searchParams.get("trxref");
  const pricing = new URL(`/workspace/${orgId}/pricing`, url.origin);

  if (!reference) {
    pricing.searchParams.set("payment", "failed");
    return NextResponse.redirect(pricing);
  }

  const result = await verifyTransaction(reference);
  const metaOrg = String(result.metadata.orgId ?? "");
  const plan = String(result.metadata.plan ?? "") as OrgPlan;

  // Must be a successful charge, for THIS org, on a real paid plan.
  if (!result.success || metaOrg !== orgId || (plan !== "PRO" && plan !== "BUSINESS")) {
    pricing.searchParams.set("payment", "failed");
    return NextResponse.redirect(pricing);
  }

  // RLS restricts the update to org admins, so a non-admin session is a no-op.
  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({ plan, plan_activated_at: new Date().toISOString() })
    .eq("id", orgId);

  pricing.searchParams.set("payment", error ? "failed" : "success");
  return NextResponse.redirect(pricing);
}
