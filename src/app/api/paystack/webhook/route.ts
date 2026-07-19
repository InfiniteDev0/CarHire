import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Paystack subscription webhook. Paystack signs the RAW body with your secret
 * key (HMAC-SHA512). This is the source of truth for a workspace's plan
 * lifecycle: activation, renewal date, failed payments, and cancellation —
 * all written straight to organizations (no plans/subscriptions tables exist).
 *
 * Set the endpoint in the Paystack dashboard → Settings → API/Webhooks:
 *   https://<your-domain>/api/paystack/webhook
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const expected = crypto
    .createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex");
  if (signature !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const event = JSON.parse(rawBody) as { event: string; data: any };
  const supabase = createAdminClient();

  // Idempotency: record each event once; a duplicate insert = already handled.
  const eventId: string =
    event.data?.id?.toString() ?? event.data?.reference ?? crypto.randomUUID();
  const { error: dedupeError } = await supabase
    .from("paystack_webhook_events")
    .insert({ id: eventId, event_type: event.event });
  if (dedupeError) {
    return NextResponse.json({ received: true, deduped: true });
  }

  const customerCode: string | undefined = event.data?.customer?.customer_code;

  switch (event.event) {
    case "charge.success": {
      // First (or renewal) charge on a plan transaction. metadata carries the
      // same keys we set in initPaystackCheckout: orgId + plan.
      const orgId = event.data?.metadata?.orgId;
      const plan = event.data?.metadata?.plan; // 'PRO' | 'BUSINESS'
      if (orgId && (plan === "PRO" || plan === "BUSINESS")) {
        await supabase
          .from("organizations")
          .update({
            plan,
            plan_status: "active",
            plan_activated_at: new Date().toISOString(),
            paystack_customer_code: customerCode ?? null,
            paystack_subscription_code: event.data?.subscription_code ?? null,
          })
          .eq("id", orgId);
      }
      break;
    }

    case "subscription.create": {
      // Recurring subscription confirmed — record its code + next charge date.
      if (customerCode) {
        await supabase
          .from("organizations")
          .update({
            plan_status: "active",
            paystack_subscription_code: event.data?.subscription_code ?? null,
            plan_renews_at: event.data?.next_payment_date ?? null,
          })
          .eq("paystack_customer_code", customerCode);
      }
      break;
    }

    case "invoice.payment_failed": {
      if (customerCode) {
        await supabase
          .from("organizations")
          .update({ plan_status: "past_due" })
          .eq("paystack_customer_code", customerCode);
      }
      break;
    }

    case "subscription.disable":
    case "subscription.not_renew": {
      // Cancelled, or Paystack gave up after repeated failures. Revert to FREE —
      // canCreateWorkspace reads organizations.plan live, so the "own a Business
      // org" gate updates itself. No cascade logic needed.
      if (customerCode) {
        await supabase
          .from("organizations")
          .update({
            plan: "FREE",
            plan_status: "canceled",
            plan_renews_at: null,
          })
          .eq("paystack_customer_code", customerCode);
      }
      break;
    }

    default:
      break;
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  return NextResponse.json({ received: true });
}
