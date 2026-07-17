"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { initPaystackCheckout } from "../actions";

type PaidPlan = "PRO" | "BUSINESS";
type Billing = "MONTHLY" | "ANNUAL";

const PLAN_META: Record<PaidPlan, { name: string; monthly: number; features: string[] }> = {
  PRO: {
    name: "Pro",
    monthly: 2500,
    features: [
      "Unlimited vehicles, staff and clients",
      "Contracts, check-in / check-out & extensions",
      "Complaints & incident log",
      "Trip reports & printable agreements",
      "Priority support",
    ],
  },
  BUSINESS: {
    name: "Business",
    monthly: 6000,
    features: [
      "Everything in Pro",
      "Multiple workspaces",
      "Advanced reporting",
      "Data export",
      "Dedicated support & custom onboarding",
    ],
  },
};

const ANNUAL_DISCOUNT = 0.2;
const kes = (n: number) => `KES ${n.toLocaleString()}`;

export function CheckoutView({
  orgId,
  orgName,
  plan,
  paymentsEnabled,
}: {
  orgId: string;
  orgName: string;
  plan: PaidPlan;
  paymentsEnabled: boolean;
}) {
  const router = useRouter();
  const meta = PLAN_META[plan];

  const [billing, setBilling] = useState<Billing>("MONTHLY");
  const [isLoading, setIsLoading] = useState(false);

  const monthlyPrice =
    billing === "ANNUAL" ? Math.round(meta.monthly * (1 - ANNUAL_DISCOUNT)) : meta.monthly;
  const dueToday =
    billing === "ANNUAL" ? Math.round(meta.monthly * (1 - ANNUAL_DISCOUNT) * 12) : meta.monthly;

  async function handlePay() {
    if (isLoading || !paymentsEnabled) return;
    setIsLoading(true);
    try {
      const { authorizationUrl } = await initPaystackCheckout(orgId, plan, billing);
      // Hand off to Paystack's hosted checkout (card / M-Pesa / bank).
      window.location.href = authorizationUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start the payment.");
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-10 py-6 md:grid-cols-2">
      {/* Left — plan + what you unlock */}
      <div className="flex flex-col gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Activate CarHire {meta.name}</h1>
          <p className="text-sm text-muted-foreground">
            Unlock everything for {orgName} in seconds.
          </p>
        </div>

        {/* Billing cycle */}
        <div className="flex flex-col gap-2">
          {(
            [
              {
                id: "MONTHLY" as Billing,
                title: "Monthly",
                sub: "Flexible — cancel any time.",
                price: meta.monthly,
              },
              {
                id: "ANNUAL" as Billing,
                title: "Annual",
                sub: "Commit for a year and save 20%.",
                price: Math.round(meta.monthly * (1 - ANNUAL_DISCOUNT)),
              },
            ] as const
          ).map((o) => {
            const selected = billing === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setBilling(o.id)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border p-4 text-left transition-colors",
                  selected ? "border-foreground bg-muted/50" : "hover:border-muted-foreground/40"
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded-full border-2",
                      selected ? "border-foreground" : "border-muted-foreground/40"
                    )}
                  >
                    {selected && <span className="size-2 rounded-full bg-foreground" />}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{o.title}</p>
                    <p className="text-xs text-muted-foreground">{o.sub}</p>
                  </div>
                </div>
                <p className="shrink-0 text-sm">
                  <span className="text-lg font-bold">{kes(o.price)}</span>
                  <span className="text-muted-foreground"> /mo</span>
                </p>
              </button>
            );
          })}
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold">What you&apos;ll unlock →</h2>
          <ul className="space-y-1.5">
            {meta.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-foreground" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right — summary + Paystack */}
      <div className="flex h-fit flex-col gap-4 rounded-2xl border p-5">
        <h2 className="text-sm font-semibold">Order summary</h2>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">
              {meta.name} · {billing === "ANNUAL" ? "Annual" : "Monthly"}
            </span>
            <span>{kes(monthlyPrice)}/mo</span>
          </div>
          {billing === "ANNUAL" && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Annual saving (20%)</span>
              <span>−{kes(Math.round(meta.monthly * 12 * ANNUAL_DISCOUNT))}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-sm text-muted-foreground">Due today</span>
          <span className="text-lg font-bold">{kes(dueToday)}</span>
        </div>

        <Button className="w-full gap-2" disabled={isLoading || !paymentsEnabled} onClick={handlePay}>
          {isLoading && <Loader2 className="size-4 animate-spin" />}
          Pay with Paystack
        </Button>

        {!paymentsEnabled && (
          <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            Payments aren&apos;t connected yet — add your Paystack keys
            (PAYSTACK_SECRET_KEY + NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY) to enable checkout.
          </p>
        )}

        <button
          type="button"
          onClick={() => router.replace(`/workspace/${orgId}`)}
          className="flex items-center justify-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Continue on the Free plan instead
          <ArrowRight className="size-3.5" />
        </button>

        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
          Paystack handles card and M-Pesa securely — we never see your card details.
        </p>
      </div>
    </div>
  );
}
