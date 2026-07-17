"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/lib/store/workspace-store";
import {
  FUEL_LEVELS,
  FUEL_LABELS,
  fuelIndex,
  REFUEL_PENALTY_PER_LEVEL,
  type FuelLevel,
} from "@/lib/validation/contract";
import {
  checkoutContract,
  checkinContract,
  extendContract,
  recordPayment,
} from "../actions";
import type { ContractRow, CheckoutLog } from "../helpers";

function FuelPicker({
  value,
  onChange,
  disabled,
}: {
  value: FuelLevel;
  onChange: (f: FuelLevel) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1.5">
      {FUEL_LEVELS.map((f) => (
        <button
          key={f}
          type="button"
          disabled={disabled}
          onClick={() => onChange(f)}
          className={cn(
            "h-9 flex-1 rounded-md border text-sm font-medium transition-colors",
            value === f
              ? "border-foreground bg-foreground text-background"
              : "border-input text-muted-foreground hover:border-foreground/40"
          )}
        >
          {FUEL_LABELS[f]}
        </button>
      ))}
    </div>
  );
}

function useAction(onDone: () => void) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  async function run(fn: () => Promise<void>, successMsg: string) {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await fn();
      toast.success(successMsg);
      router.refresh();
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }
  return { isLoading, run };
}

/* ── Checkout ──────────────────────────────────────────────────────────── */
export function CheckoutDialog({
  orgId,
  contract,
  open,
  onOpenChange,
  onDone,
}: {
  orgId: string;
  contract: ContractRow;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone?: () => void;
}) {
  const [mileage, setMileage] = useState("");
  const [fuel, setFuel] = useState<FuelLevel>("FULL");
  const [signature, setSignature] = useState("");
  const { isLoading, run } = useAction(() => {
    onOpenChange(false);
    onDone?.();
  });

  const clientName = contract.clients?.full_name ?? "";
  const signatureOk =
    signature.trim().length > 1 &&
    signature.trim().toLowerCase() === clientName.trim().toLowerCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Check out {contract.cars?.reg_number}</DialogTitle>
          <DialogDescription>
            Keys handed to {clientName || "the client"}. The rental clock starts now
            ({contract.duration_days} days).
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="coMileage">Starting mileage (km)</Label>
            <Input
              id="coMileage"
              type="number"
              inputMode="numeric"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="45350"
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Fuel level on issue</Label>
            <FuelPicker value={fuel} onChange={setFuel} disabled={isLoading} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="coSignature">Client signature</Label>
            <Input
              id="coSignature"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder={`Type "${clientName}" to confirm`}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Typed-name confirmation for MVP — biometric capture comes later.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={isLoading || !signatureOk}
            onClick={() =>
              run(
                () => checkoutContract(orgId, contract.id, { mileage, fuel, signature }),
                "Vehicle checked out — trip started"
              )
            }
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            Confirm checkout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Checkin ───────────────────────────────────────────────────────────── */
export function CheckinDialog({
  orgId,
  contract,
  checkout,
  open,
  onOpenChange,
}: {
  orgId: string;
  contract: ContractRow;
  checkout: CheckoutLog | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [returnedBy, setReturnedBy] = useState(contract.clients?.full_name ?? "");
  const [mileage, setMileage] = useState("");
  const [fuel, setFuelState] = useState<FuelLevel>("FULL");
  const [penalty, setPenalty] = useState("0");
  const { isLoading, run } = useAction(() => onOpenChange(false));

  const issueFuel = checkout?.fuel_at_issue ?? null;

  function pickFuel(f: FuelLevel) {
    setFuelState(f);
    if (issueFuel) {
      const short = Math.max(0, fuelIndex(issueFuel) - fuelIndex(f));
      setPenalty(String(short * REFUEL_PENALTY_PER_LEVEL));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Check in {contract.cars?.reg_number}</DialogTitle>
          <DialogDescription>
            Car back at base — this completes the contract and frees the vehicle.
            {issueFuel && <> Issued at fuel level {FUEL_LABELS[issueFuel]}.</>}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ciReturnedBy">Returned by</Label>
            <Input
              id="ciReturnedBy"
              value={returnedBy}
              onChange={(e) => setReturnedBy(e.target.value)}
              placeholder="Who brought the car back"
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ciMileage">Ending mileage (km)</Label>
            <Input
              id="ciMileage"
              type="number"
              inputMode="numeric"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              placeholder="46120"
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Fuel level on return</Label>
            <FuelPicker value={fuel} onChange={pickFuel} disabled={isLoading} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ciPenalty">Refuel penalty (KES)</Label>
            <Input
              id="ciPenalty"
              type="number"
              inputMode="numeric"
              value={penalty}
              onChange={(e) => setPenalty(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Auto-suggested at KES {REFUEL_PENALTY_PER_LEVEL.toLocaleString()} per missing
              gauge step — adjust if needed. Unpaid balances roll into client debt.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={isLoading}
            onClick={() =>
              run(
                () =>
                  checkinContract(orgId, contract.id, {
                    returnedBy,
                    mileage,
                    fuel,
                    refuelPenalty: penalty,
                  }),
                "Vehicle checked in — contract completed"
              )
            }
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            Confirm check-in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Extend ────────────────────────────────────────────────────────────── */
export function ExtendDialog({
  orgId,
  contract,
  balance,
  open,
  onOpenChange,
}: {
  orgId: string;
  contract: ContractRow;
  balance: number;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const isAdmin = useIsAdmin();
  const halfBalance = Math.ceil(Math.max(0, balance) / 2);
  const [extraDays, setExtraDays] = useState("1");
  const [requiredPayment, setRequiredPayment] = useState(String(halfBalance));
  const [amountPaid, setAmountPaid] = useState("");
  const { isLoading, run } = useAction(() => onOpenChange(false));
  const extraCost = (Number(extraDays) || 0) * Number(contract.rate_per_day);
  const required = isAdmin ? Number(requiredPayment) || 0 : halfBalance;
  const paidEnough = (Number(amountPaid) || 0) >= required;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Extend rental</DialogTitle>
          <DialogDescription>
            Outstanding balance: KES {Math.max(0, balance).toLocaleString()}. The client must pay{" "}
            {isAdmin ? "the required amount" : "half of it"} before an extension is authorized.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="extraDays">Extra days</Label>
            <Input
              id="extraDays"
              type="number"
              min={1}
              inputMode="numeric"
              value={extraDays}
              onChange={(e) => setExtraDays(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Adds KES {extraCost.toLocaleString()} at the contract rate (KES{" "}
              {Number(contract.rate_per_day).toLocaleString()}/day).
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="extRequired">Required payment (KES)</Label>
            <Input
              id="extRequired"
              type="number"
              min={0}
              inputMode="numeric"
              value={isAdmin ? requiredPayment : String(halfBalance)}
              onChange={(e) => setRequiredPayment(e.target.value)}
              disabled={isLoading || !isAdmin}
            />
            <p className="text-xs text-muted-foreground">
              {isAdmin
                ? "Defaults to half the balance — you can adjust it."
                : "Half the outstanding balance. Only an admin can change this."}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="extPaid">Amount paid now (KES)</Label>
            <Input
              id="extPaid"
              type="number"
              min={0}
              inputMode="numeric"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder={String(required)}
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={isLoading || !paidEnough}
            onClick={() =>
              run(
                () =>
                  extendContract(orgId, contract.id, {
                    extraDays,
                    amountPaid,
                    requiredPayment: isAdmin ? requiredPayment : "",
                  }),
                "Extension authorized"
              )
            }
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            Authorize extension
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Payment ───────────────────────────────────────────────────────────── */
export function PaymentDialog({
  orgId,
  contract,
  balance,
  open,
  onOpenChange,
}: {
  orgId: string;
  contract: ContractRow;
  balance: number;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const { isLoading, run } = useAction(() => onOpenChange(false));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>
            Outstanding balance: KES {Math.max(0, balance).toLocaleString()}. Entered by staff
            when the client pays.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="payAmount">Amount received (KES)</Label>
            <Input
              id="payAmount"
              type="number"
              min={1}
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={balance > 0 ? String(balance) : "0"}
              disabled={isLoading}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Paid via</Label>
            <div className="flex gap-1.5">
              {(["CASH", "MPESA", "BANK", "OTHER"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  disabled={isLoading}
                  onClick={() => setMethod(m)}
                  className={cn(
                    "h-8 flex-1 rounded-md border text-xs font-medium transition-colors",
                    method === m
                      ? "border-foreground bg-foreground text-background"
                      : "border-input text-muted-foreground hover:border-foreground/40"
                  )}
                >
                  {m === "MPESA" ? "M-Pesa" : m.charAt(0) + m.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={isLoading || !amount}
            onClick={() =>
              run(() => recordPayment(orgId, contract.id, { amount, method }), "Payment recorded")
            }
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
