import "server-only";

const API = "https://api.paystack.co";

export function paystackConfigured(): boolean {
  return !!process.env.PAYSTACK_SECRET_KEY;
}

function secret(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Payments aren't set up yet — add PAYSTACK_SECRET_KEY to your environment."
    );
  }
  return key;
}

export interface InitTransactionArgs {
  email: string;
  /** Major currency units (e.g. KES 2500). One-time charge. Omit when `plan` is set. */
  amount?: number;
  /**
   * Paystack plan code — turns the transaction into a recurring subscription.
   * The plan carries its own amount/interval, so `amount` is not needed.
   * Recurring billing requires a card (Paystack can't auto-charge M-Pesa), so
   * the checkout is card-only when a plan is provided.
   */
  plan?: string;
  currency?: string;
  reference?: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}

export interface InitTransactionResult {
  authorizationUrl: string;
  reference: string;
}

/** Create a Paystack transaction and get the hosted-checkout URL. */
export async function initializeTransaction(
  args: InitTransactionArgs
): Promise<InitTransactionResult> {
  if (!args.plan && args.amount == null) {
    throw new Error("initializeTransaction needs a plan code or an amount.");
  }

  const body: Record<string, unknown> = {
    email: args.email,
    currency: args.currency ?? "KES",
    reference: args.reference,
    callback_url: args.callbackUrl,
    metadata: args.metadata,
    // Recurring subscriptions must be tokenised → card only. One-time charges
    // can use the full set (M-Pesa via mobile_money, bank, USSD).
    channels: args.plan ? ["card"] : ["card", "mobile_money", "bank", "ussd"],
  };
  // Paystack requires `amount` on /transaction/initialize even when a `plan`
  // is set (the plan's own amount is what actually gets charged) — omitting it
  // fails with "Invalid Amount Sent". So always send the amount when we have it.
  if (args.amount != null) body.amount = Math.round(args.amount * 100); // KES → cents
  if (args.plan) body.plan = args.plan;

  const res = await fetch(`${API}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message || "Could not start the payment.");
  }
  return {
    authorizationUrl: json.data.authorization_url as string,
    reference: json.data.reference as string,
  };
}

export interface VerifyResult {
  success: boolean;
  metadata: Record<string, unknown>;
  amount: number; // major units
}

/** Confirm a transaction actually succeeded (called on the callback). */
export async function verifyTransaction(reference: string): Promise<VerifyResult> {
  const res = await fetch(`${API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret()}` },
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    return { success: false, metadata: {}, amount: 0 };
  }
  return {
    success: json.data.status === "success",
    metadata: (json.data.metadata ?? {}) as Record<string, unknown>,
    amount: Number(json.data.amount ?? 0) / 100,
  };
}
