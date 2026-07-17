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
  /** Major currency units (e.g. KES 2500) — converted to the smallest unit here. */
  amount: number;
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
  const res = await fetch(`${API}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: args.email,
      amount: Math.round(args.amount * 100), // KES → cents
      currency: args.currency ?? "KES",
      reference: args.reference,
      callback_url: args.callbackUrl,
      metadata: args.metadata,
      channels: ["card", "mobile_money", "bank", "ussd"],
    }),
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
