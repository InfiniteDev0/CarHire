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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  penaltyPerStep = REFUEL_PENALTY_PER_LEVEL,
  open,
  onOpenChange,
  onDone,
}: {
  orgId: string;
  contract: ContractRow;
  checkout: CheckoutLog | null;
  penaltyPerStep?: number;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone?: () => void;
}) {
  const [returnedBy, setReturnedBy] = useState(contract.clients?.full_name ?? "");
  const [mileage, setMileage] = useState("");
  const [fuel, setFuelState] = useState<FuelLevel>("FULL");
  const [penalty, setPenalty] = useState("0");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { isLoading, run } = useAction(() => {
    onOpenChange(false);
    onDone?.();
  });

  const issueFuel = checkout?.fuel_at_issue ?? null;
  const startKm = checkout?.mileage ?? null;
  // Odometers only go forward — same or lower than checkout is a typo.
  const mileageInvalid =
    startKm != null && mileage !== "" && Number(mileage) <= Number(startKm);

  function pickFuel(f: FuelLevel) {
    setFuelState(f);
    if (issueFuel) {
      const short = Math.max(0, fuelIndex(issueFuel) - fuelIndex(f));
      setPenalty(String(short * penaltyPerStep));
    }
  }

  function doCheckin() {
    setConfirmOpen(false);
    run(
      () =>
        checkinContract(orgId, contract.id, {
          returnedBy,
          mileage,
          fuel,
          refuelPenalty: penalty,
        }),
      `${contract.cars?.reg_number ?? "Car"} has just checked in — contract completed`
    );
  }

  return (
    <>
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
              {startKm != null && (
                <p className="text-xs text-muted-foreground">
                  Went out at{" "}
                  <span className="font-medium text-foreground">
                    {Number(startKm).toLocaleString()} km
                  </span>{" "}
                  — the return reading must be higher.
                </p>
              )}
              <Input
                id="ciMileage"
                type="number"
                inputMode="numeric"
                min={startKm != null ? Number(startKm) + 1 : 0}
                value={mileage}
                onChange={(e) => setMileage(e.target.value)}
                placeholder={startKm != null ? String(Number(startKm) + 100) : "46120"}
                disabled={isLoading}
                aria-invalid={mileageInvalid}
              />
              {mileageInvalid && (
                <p className="text-xs text-destructive">
                  Must be higher than {Number(startKm).toLocaleString()} km — the reading at
                  checkout.
                </p>
              )}
              {startKm != null && !mileageInvalid && mileage !== "" && (
                <p className="text-xs text-muted-foreground">
                  Distance covered: {(Number(mileage) - Number(startKm)).toLocaleString()} km
                </p>
              )}
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
                Auto-suggested at KES {penaltyPerStep.toLocaleString()} per missing gauge
                step (set by the admin in Settings → Operations). Penalties can&apos;t be
                added after check-in, so record them now.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              disabled={isLoading || mileageInvalid}
              onClick={() => setConfirmOpen(true)}
            >
              {isLoading && <Loader2 className="size-4 animate-spin" />}
              {isLoading ? "Checking in car…" : "Complete check-in"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Final gate — after this, penalties and damage charges are locked. */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm check-in?</AlertDialogTitle>
            <AlertDialogDescription>
              Please check the car&apos;s condition, fuel level, mileage and any penalties
              before confirming. Once {contract.cars?.reg_number ?? "the car"} is checked
              in, problems and penalties can no longer be recorded on this rental.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Go back and check</AlertDialogCancel>
            <AlertDialogAction onClick={doCheckin}>
              Everything is checked — complete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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
  const [reference, setReference] = useState("");
  const { isLoading, run } = useAction(() => onOpenChange(false));

  const referenceMeta: Record<string, { label: string; placeholder: string }> = {
    CASH: { label: "Receipt no. (optional)", placeholder: "e.g. RCT-0042" },
    MPESA: {
      label: "M-Pesa code / message",
      placeholder: "e.g. SFG3K1XQ2P Confirmed. KES 5,000 received…",
    },
    CARD: { label: "Card reference (optional)", placeholder: "Last 4 digits / auth code" },
    BANK: { label: "Bank reference (optional)", placeholder: "Transfer/slip reference" },
    OTHER: { label: "Reference (optional)", placeholder: "How was this paid?" },
  };

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
              {(["CASH", "MPESA", "CARD", "BANK", "OTHER"] as const).map((m) => (
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="payReference">{referenceMeta[method].label}</Label>
            <Input
              id="payReference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={referenceMeta[method].placeholder}
              disabled={isLoading}
            />
            {method === "MPESA" && (
              <p className="text-xs text-muted-foreground">
                Paste the confirmation message or just the transaction code.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={isLoading || !amount}
            onClick={() =>
              run(
                () => recordPayment(orgId, contract.id, { amount, method, reference }),
                "Payment recorded"
              )
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
