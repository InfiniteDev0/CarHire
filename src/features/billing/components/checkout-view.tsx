"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CreditCard,
  Smartphone,
  Wallet,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { normalizeKenyanPhone } from "@/lib/validation/client";
import { activatePlan } from "../actions";

type PaidPlan = "PRO" | "BUSINESS";
type Method = "CARD" | "MPESA" | "PAYPAL";
type Billing = "MONTHLY" | "ANNUAL";

const PLAN_META: Record<
  PaidPlan,
  { name: string; monthly: number; features: string[] }
> = {
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

const ANNUAL_DISCOUNT = 0.2; // commit for a year, save 20%
const kes = (n: number) => `KES ${n.toLocaleString()}`;

export function CheckoutView({
  orgId,
  orgName,
  plan,
  billedTo,
}: {
  orgId: string;
  orgName: string;
  plan: PaidPlan;
  billedTo: string;
}) {
  const router = useRouter();
  const meta = PLAN_META[plan];

  const [billing, setBilling] = useState<Billing>("MONTHLY");
  const [method, setMethod] = useState<Method>("CARD");
  const [name, setName] = useState(billedTo);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const monthlyPrice =
    billing === "ANNUAL" ? Math.round(meta.monthly * (1 - ANNUAL_DISCOUNT)) : meta.monthly;

  const detailsOk = (() => {
    if (name.trim().length < 2) return false;
    if (method === "CARD") {
      return (
        cardNumber.replace(/\s/g, "").length >= 15 &&
        /^\d{2}\s?\/\s?\d{2}$/.test(expiry) &&
        /^\d{3,4}$/.test(cvv)
      );
    }
    if (method === "MPESA") return normalizeKenyanPhone(mpesaPhone) !== null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalEmail);
  })();

  async function handleSubscribe() {
    if (isLoading || !detailsOk) return;
    setIsLoading(true);
    try {
      await activatePlan(orgId, plan, method);
      toast.success(`${orgName} is now on ${meta.name} — everything is unlocked.`);
      router.replace(`/workspace/${orgId}/pricing`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-10 py-6 md:grid-cols-2">
      {/* Left — plan */}
      <div className="flex flex-col gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Activate CarHire {meta.name}
          </h1>
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
                title: "Monthly plan",
                sub: "Flexible — cancel any time.",
                price: meta.monthly,
              },
              {
                id: "ANNUAL" as Billing,
                title: "Annual plan",
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
                  <span className="text-muted-foreground"> /month</span>
                </p>
              </button>
            );
          })}
        </div>

        {/* Unlocks */}
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

      {/* Right — payment */}
      <div className="flex flex-col gap-4">
        {/* Method tabs */}
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: "CARD" as Method, label: "Card", icon: CreditCard },
              { id: "MPESA" as Method, label: "M-Pesa", icon: Smartphone },
              { id: "PAYPAL" as Method, label: "PayPal", icon: Wallet },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm transition-colors",
                method === m.id
                  ? "border-foreground bg-muted/50 font-medium"
                  : "text-muted-foreground hover:border-muted-foreground/40"
              )}
            >
              <m.icon className="size-4" />
              {m.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="billedTo">Billed to</Label>
          <Input
            id="billedTo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            disabled={isLoading}
          />
        </div>

        {method === "CARD" && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cardNumber">Card number</Label>
              <Input
                id="cardNumber"
                inputMode="numeric"
                value={cardNumber}
                onChange={(e) =>
                  setCardNumber(
                    e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 16)
                      .replace(/(\d{4})(?=\d)/g, "$1 ")
                  )
                }
                placeholder="1234 5678 9012 3456"
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="expiry">MM / YY</Label>
                <Input
                  id="expiry"
                  inputMode="numeric"
                  value={expiry}
                  onChange={(e) => {
                    const d = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setExpiry(d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d);
                  }}
                  placeholder="MM / YY"
                  disabled={isLoading}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  inputMode="numeric"
                  type="password"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="123"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        )}

        {method === "MPESA" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mpesaPhone">M-Pesa number</Label>
            <Input
              id="mpesaPhone"
              type="tel"
              value={mpesaPhone}
              onChange={(e) => setMpesaPhone(e.target.value)}
              placeholder="+254 7XX XXX XXX"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              You&apos;ll get an STK push on this number to confirm the payment.
            </p>
          </div>
        )}

        {method === "PAYPAL" && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="paypalEmail">PayPal email</Label>
            <Input
              id="paypalEmail"
              type="email"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              You&apos;ll be asked to approve the subscription in PayPal.
            </p>
          </div>
        )}

        {/* Total + subscribe */}
        <div className="mt-2 flex items-center justify-between border-t pt-4">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-lg font-bold">
            {kes(monthlyPrice)} <span className="text-sm font-normal text-muted-foreground">/month</span>
          </span>
        </div>
        <Button className="w-full" disabled={isLoading || !detailsOk} onClick={handleSubscribe}>
          {isLoading && <Loader2 className="size-4 animate-spin" />}
          Subscribe to {meta.name}
        </Button>
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
          Test mode — no real charge is made until Stripe (card), Daraja (M-Pesa) or PayPal
          API keys are connected. Subscribing activates the plan immediately.
        </p>
      </div>
    </div>
  );
}
