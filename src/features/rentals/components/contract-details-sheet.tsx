"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  X,
  LogIn,
  LogOut,
  CalendarPlus,
  Banknote,
  Undo2,
  Loader2,
  ClipboardList,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidePanel } from "@/components/workspace/side-panel";
import { FUEL_LABELS } from "@/lib/validation/contract";
import { cancelContract } from "../actions";
import {
  displayStatus,
  contractBalance,
  type ContractRow,
  type CheckoutLog,
  type CheckinLog,
} from "../helpers";
import {
  CheckoutDialog,
  CheckinDialog,
  ExtendDialog,
  PaymentDialog,
} from "./rental-dialogs";
import { TripReportDialog } from "./trip-report-dialog";

const kes = (n: number) => `KES ${Number(n).toLocaleString()}`;
const fmt = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("en-KE", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-zinc-800 text-zinc-300 border border-zinc-700",
  ACTIVE: "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  EXTENDED: "border border-purple-500/20 bg-purple-500/10 text-purple-400",
  OVERDUE: "border border-red-500/20 bg-red-500/10 text-red-400",
  COMPLETED: "border border-blue-500/20 bg-blue-500/10 text-blue-400",
  CANCELLED: "bg-zinc-800 text-zinc-500 border border-zinc-700",
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-800/70 py-2 last:border-0">
      <span className="shrink-0 text-zinc-500">{label}</span>
      <span className="truncate text-right text-zinc-200">{value || "—"}</span>
    </div>
  );
}

export function ContractDetailsSheet({
  orgId,
  contract,
  logs,
  open,
  onOpenChange,
  staffNames,
}: {
  orgId: string;
  contract: ContractRow | null;
  logs: { checkout: CheckoutLog | null; checkin: CheckinLog | null } | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  staffNames?: Record<string, string>;
}) {
  const router = useRouter();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!contract) return null;

  const status = displayStatus(contract);
  const balance = contractBalance(contract);
  const carLabel = contract.cars
    ? `${contract.cars.reg_number} · ${[contract.cars.make, contract.cars.model].filter(Boolean).join(" ")}`
    : "Vehicle";

  function doCancel() {
    if (!contract) return;
    startTransition(async () => {
      try {
        await cancelContract(orgId, contract.id);
        toast.success("Rental deleted");
        router.refresh();
        onOpenChange(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <SidePanel open={open} onClose={() => onOpenChange(false)}>
      {/* Top */}
      <div className="flex items-center justify-between">
        <Button
          onClick={() => onOpenChange(false)}
          className="size-8 rounded-full bg-zinc-800 p-0 text-white hover:bg-zinc-700"
        >
          <X className="size-4" />
        </Button>
        <Badge className={STATUS_BADGE[status]}>{status}</Badge>
      </div>

      {/* Header */}
      <div className="border-b border-zinc-800 pb-4">
        <h1 className="text-xl font-bold tracking-tight">{contract.clients?.full_name ?? "Client"}</h1>
        <p className="mt-0.5 text-xs text-zinc-500">{carLabel}</p>
      </div>

      {/* Financial tiles */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-zinc-900 p-2.5">
          <p className="text-xs text-zinc-500">Total</p>
          <p className="text-sm font-bold">{kes(contract.total_amount ?? 0)}</p>
        </div>
        <div className="rounded-md bg-zinc-900 p-2.5">
          <p className="text-xs text-zinc-500">Paid</p>
          <p className="text-sm font-bold text-emerald-400">{kes(contract.amount_paid ?? 0)}</p>
        </div>
        <div className="rounded-md bg-zinc-900 p-2.5">
          <p className="text-xs text-zinc-500">Balance</p>
          <p className={`text-sm font-bold ${balance > 0 ? "text-red-400" : "text-zinc-300"}`}>
            {kes(Math.max(0, balance))}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="flex-1 text-sm text-zinc-400">
        <Row label="Period" value={`${fmt(contract.contract_start)} → ${fmt(contract.contract_expiration)}`} />
        <Row label="Duration" value={`${contract.duration_days} days`} />
        <Row label="Rate" value={`${kes(Number(contract.rate_per_day))}/day`} />
        {contract.deposit_amount > 0 && (
          <Row label="Deposit" value={kes(contract.deposit_amount)} />
        )}
        {contract.refuel_penalty > 0 && (
          <Row label="Refuel penalty" value={kes(contract.refuel_penalty)} />
        )}
        <Row
          label="Driver"
          value={
            contract.is_self_drive
              ? "Self-drive"
              : `${contract.driver_name ?? "—"} (DL ${contract.driver_dl_number ?? "—"})`
          }
        />
        <Row label="Routing" value={contract.routing} />
        <Row label="Domicile" value={contract.domicile} />
        {contract.created_by && staffNames?.[contract.created_by] && (
          <Row label="Created by" value={staffNames[contract.created_by]} />
        )}

        {/* Logs */}
        <p className="mb-1 mt-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Operational log
        </p>
        {logs === null ? (
          <div className="flex min-h-16 items-center justify-center">
            <Loader2 className="size-4 animate-spin text-zinc-600" />
          </div>
        ) : (
          <>
            {logs.checkout ? (
              <div className="rounded-md border border-zinc-800 bg-zinc-900/50 p-3 text-xs">
                <p className="font-medium text-zinc-200">Checked out · {fmt(logs.checkout.created_at)}</p>
                <p className="mt-1 text-zinc-500">
                  Mileage {logs.checkout.mileage?.toLocaleString() ?? "—"} km · Fuel{" "}
                  {logs.checkout.fuel_at_issue ? FUEL_LABELS[logs.checkout.fuel_at_issue] : "—"} ·
                  Signed “{logs.checkout.signature ?? "—"}”
                </p>
              </div>
            ) : (
              <p className="text-xs text-zinc-600">Not checked out yet.</p>
            )}
            {logs.checkin && (
              <div className="mt-2 rounded-md border border-zinc-800 bg-zinc-900/50 p-3 text-xs">
                <p className="font-medium text-zinc-200">Checked in · {fmt(logs.checkin.created_at)}</p>
                <p className="mt-1 text-zinc-500">
                  Returned by {logs.checkin.returned_by ?? "—"} · Mileage{" "}
                  {logs.checkin.mileage?.toLocaleString() ?? "—"} km · Fuel{" "}
                  {logs.checkin.fuel_at_return ? FUEL_LABELS[logs.checkin.fuel_at_return] : "—"}
                  {logs.checkin.refuel_penalty > 0 &&
                    ` · Penalty ${kes(logs.checkin.refuel_penalty)}`}
                </p>
                {logs.checkout?.mileage != null && logs.checkin.mileage != null && (
                  <p className="mt-1 text-zinc-500">
                    Distance covered:{" "}
                    <span className="text-zinc-300">
                      {Math.max(0, logs.checkin.mileage - logs.checkout.mileage).toLocaleString()} km
                    </span>{" "}
                    ({logs.checkout.mileage.toLocaleString()} → {logs.checkin.mileage.toLocaleString()})
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions by state */}
      <div className="flex flex-col gap-2 border-t border-zinc-800 pt-3">
        {status !== "CANCELLED" && (
          <Button
            asChild
            variant="outline"
            className="w-full border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-900"
          >
            <Link href={`/print/${orgId}/contracts/${contract.id}`} target="_blank">
              <FileDown className="size-4" />
              Contract PDF
            </Link>
          </Button>
        )}
        {status === "DRAFT" && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={isPending}
              className="flex-1 border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-900"
              onClick={doCancel}
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />}
              Delete draft
            </Button>
            <Button className="flex-1" onClick={() => setCheckoutOpen(true)}>
              <LogOut className="size-4" />
              Check out
            </Button>
          </div>
        )}
        {(status === "ACTIVE" || status === "EXTENDED" || status === "OVERDUE") && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-900"
              onClick={() => setExtendOpen(true)}
            >
              <CalendarPlus className="size-4" />
              Extend
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-900"
              onClick={() => setPaymentOpen(true)}
            >
              <Banknote className="size-4" />
              Payment
            </Button>
            <Button className="flex-1" onClick={() => setCheckinOpen(true)}>
              <LogIn className="size-4" />
              Check in
            </Button>
          </div>
        )}
        {status === "CANCELLED" && (
          <Button
            variant="outline"
            disabled={isPending}
            className="w-full border-zinc-700 bg-transparent text-red-400 hover:bg-zinc-900"
            onClick={doCancel}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <Undo2 className="size-4" />}
            Delete this cancelled rental
          </Button>
        )}
        {status === "COMPLETED" && (
          <div className="flex flex-col gap-2">
            {balance > 0 && (
              <Button className="w-full" onClick={() => setPaymentOpen(true)}>
                <Banknote className="size-4" />
                Record payment ({kes(balance)} outstanding)
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-900"
              onClick={() => setReportOpen(true)}
            >
              <ClipboardList className="size-4" />
              Trip report
            </Button>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CheckoutDialog
        orgId={orgId}
        contract={contract}
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        onDone={() => onOpenChange(false)}
      />
      <CheckinDialog
        orgId={orgId}
        contract={contract}
        checkout={logs?.checkout ?? null}
        open={checkinOpen}
        onOpenChange={setCheckinOpen}
      />
      <ExtendDialog
        orgId={orgId}
        contract={contract}
        balance={balance}
        open={extendOpen}
        onOpenChange={setExtendOpen}
      />
      <PaymentDialog
        orgId={orgId}
        contract={contract}
        balance={balance}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
      />
      <TripReportDialog
        orgId={orgId}
        contract={contract}
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
    </SidePanel>
  );
}
