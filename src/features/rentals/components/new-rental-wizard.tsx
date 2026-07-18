"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { X, Search, Loader2, TriangleAlert, Check, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SidePanel } from "@/components/workspace/side-panel";
import { useIsAdmin } from "@/lib/store/workspace-store";
import { createContractSchema, composeRouting, type RouteLeg } from "@/lib/validation/contract";
import { createContract } from "../actions";
import { isInCurfew } from "../helpers";

export interface PickClient {
  id: string;
  full_name: string;
  phone: string | null;
  national_id: string | null;
  is_blocked: boolean;
  debt_owed: number;
}

export interface PickCar {
  id: string;
  reg_number: string;
  make: string | null;
  model: string | null;
  rate_per_day: number | null;
  deposit: number | null;
}

export interface OrgRules {
  curfew_start: string | null;
  curfew_end: string | null;
  rate_floor: number | null;
  rate_ceiling: number | null;
  refuel_penalty_per_level: number | null;
}

const STEPS = ["Client", "Vehicle", "Driver", "Terms", "Review"] as const;
const kes = (n: number) => `KES ${n.toLocaleString()}`;

const inputClass =
  "h-9 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600";

export function NewRentalWizard({
  orgId,
  clients,
  cars,
  rules,
  open,
  onOpenChange,
  initialCarId,
}: {
  orgId: string;
  clients: PickClient[];
  cars: PickCar[];
  rules: OrgRules;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialCarId?: string | null;
}) {
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const [step, setStep] = useState(0);
  const [clientSearch, setClientSearch] = useState("");
  const [carSearch, setCarSearch] = useState("");
  const [clientId, setClientId] = useState("");
  const [carId, setCarId] = useState(initialCarId ?? "");
  const [isSelfDrive, setIsSelfDrive] = useState(true);
  const [driverName, setDriverName] = useState("");
  const [driverDlNumber, setDriverDlNumber] = useState("");
  const [driverDlExpiry, setDriverDlExpiry] = useState("");
  const [durationDays, setDurationDays] = useState("1");
  const [ratePerDay, setRatePerDay] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [routeLegs, setRouteLegs] = useState<RouteLeg[]>([{ from: "", to: "" }]);
  const [domicile, setDomicile] = useState("Nairobi");
  const [isLoading, setIsLoading] = useState(false);

  // Reset when (re)opened — render-time reset keeps lint happy.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setStep(0);
      setClientSearch("");
      setCarSearch("");
      setClientId("");
      setCarId(initialCarId ?? "");
      setIsSelfDrive(true);
      setDriverName("");
      setDriverDlNumber("");
      setDriverDlExpiry("");
      setDurationDays("1");
      setRatePerDay("");
      setDepositAmount("");
      setRouteLegs([{ from: "", to: "" }]);
      setDomicile("Nairobi");
    }
  }

  const client = clients.find((c) => c.id === clientId) ?? null;
  const car = cars.find((c) => c.id === carId) ?? null;

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.full_name, c.phone, c.national_id].filter(Boolean).some((v) => v!.toLowerCase().includes(q))
    );
  }, [clients, clientSearch]);

  const filteredCars = useMemo(() => {
    const q = carSearch.trim().toLowerCase();
    if (!q) return cars;
    return cars.filter((c) =>
      [c.reg_number, c.make, c.model].filter(Boolean).some((v) => v!.toLowerCase().includes(q))
    );
  }, [cars, carSearch]);

  const total = (Number(durationDays) || 0) * (Number(ratePerDay) || 0);
  const curfewNow = isInCurfew(new Date(), rules.curfew_start, rules.curfew_end);

  const rateOutOfBounds =
    ratePerDay &&
    ((rules.rate_floor != null && Number(ratePerDay) < Number(rules.rate_floor)) ||
      (rules.rate_ceiling != null && Number(ratePerDay) > Number(rules.rate_ceiling)));

  // Staff can't change an admin-set deposit; the field locks to the car's price.
  const depositLocked = !isAdmin && car?.deposit != null;

  function canAdvance(): boolean {
    switch (step) {
      case 0:
        return !!client && !client.is_blocked;
      case 1:
        return !!car;
      case 2:
        return isSelfDrive || (!!driverName && !!driverDlNumber && !!driverDlExpiry);
      case 3:
        return (
          Number(durationDays) >= 1 &&
          Number(ratePerDay) > 0 &&
          Number(depositAmount) > 0 &&
          !rateOutOfBounds
        );
      default:
        return true;
    }
  }

  function pickCar(c: PickCar) {
    setCarId(c.id);
    // Rate and deposit are defined on the car — prefill both.
    if (c.rate_per_day != null) setRatePerDay(String(c.rate_per_day));
    setDepositAmount(c.deposit != null ? String(c.deposit) : "");
  }

  function setLeg(i: number, key: keyof RouteLeg, value: string) {
    setRouteLegs((legs) => legs.map((l, idx) => (idx === i ? { ...l, [key]: value } : l)));
  }

  async function handleCreate() {
    if (isLoading) return;
    const input = {
      clientId,
      carId,
      isSelfDrive,
      driverName,
      driverDlNumber,
      driverDlExpiry,
      durationDays,
      ratePerDay,
      depositAmount,
      routeLegs,
      domicile,
    };
    const parsed = createContractSchema.safeParse(input);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the details.");
      return;
    }
    setIsLoading(true);
    try {
      await createContract(orgId, parsed.data);
      toast.success("Rental created as a draft — check it out to start the trip");
      router.refresh();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SidePanel open={open} onClose={() => onOpenChange(false)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">New rental</h2>
          <p className="text-xs text-zinc-500">
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>
        </div>
        <Button
          onClick={() => onOpenChange(false)}
          className="size-8 rounded-full bg-zinc-800 p-0 text-white hover:bg-zinc-700"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {STEPS.map((s, i) => (
          <span
            key={s}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i <= step ? "bg-white" : "bg-zinc-800"
            )}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex flex-col gap-3"
          >
            {step === 0 && (
              <>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
                  <input
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Search name, phone or ID…"
                    className={`${inputClass} pl-8`}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  {filteredClients.length === 0 && (
                    <p className="py-6 text-center text-xs text-zinc-600">
                      No clients found — add them on the Clients page first.
                    </p>
                  )}
                  {filteredClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      disabled={c.is_blocked}
                      onClick={() => setClientId(c.id)}
                      className={cn(
                        "flex items-center justify-between rounded-md border p-3 text-left transition-colors",
                        clientId === c.id
                          ? "border-white bg-white/5"
                          : "border-zinc-800 hover:border-zinc-600",
                        c.is_blocked && "cursor-not-allowed opacity-50"
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-100">{c.full_name}</p>
                        <p className="text-xs text-zinc-500">
                          {c.phone || "no phone"}
                          {c.national_id ? ` · ${c.national_id}` : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {c.is_blocked && (
                          <Badge className="border border-red-500/20 bg-red-500/10 text-red-400">
                            Blocked
                          </Badge>
                        )}
                        {!c.is_blocked && c.debt_owed > 0 && (
                          <Badge className="border border-amber-500/20 bg-amber-500/10 text-amber-400">
                            Debt {kes(Number(c.debt_owed))}
                          </Badge>
                        )}
                        {clientId === c.id && <Check className="size-4 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />
                  <input
                    value={carSearch}
                    onChange={(e) => setCarSearch(e.target.value)}
                    placeholder="Search reg, make or model…"
                    className={`${inputClass} pl-8`}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  {filteredCars.length === 0 && (
                    <p className="py-6 text-center text-xs text-zinc-600">
                      No available vehicles — only cars with status AVAILABLE can be rented.
                    </p>
                  )}
                  {filteredCars.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => pickCar(c)}
                      className={cn(
                        "flex items-center justify-between rounded-md border p-3 text-left transition-colors",
                        carId === c.id
                          ? "border-white bg-white/5"
                          : "border-zinc-800 hover:border-zinc-600"
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-zinc-100">{c.reg_number}</p>
                        <p className="text-xs text-zinc-500">
                          {[c.make, c.model].filter(Boolean).join(" ") || "Vehicle"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 text-sm text-zinc-300">
                        {c.rate_per_day != null && <span>{kes(Number(c.rate_per_day))}/day</span>}
                        {carId === c.id && <Check className="size-4 text-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="flex gap-2">
                  {[
                    { v: true, label: "Self-drive" },
                    { v: false, label: "Designated driver" },
                  ].map((o) => (
                    <button
                      key={o.label}
                      type="button"
                      onClick={() => setIsSelfDrive(o.v)}
                      className={cn(
                        "flex-1 rounded-md border px-3 py-2 text-sm transition-colors",
                        isSelfDrive === o.v
                          ? "border-white bg-white text-black"
                          : "border-zinc-800 text-zinc-300 hover:border-zinc-600"
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                {isSelfDrive ? (
                  <p className="text-xs text-zinc-500">
                    {client?.full_name || "The client"} drives. Their ID is already on file.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <Label>Driver name</Label>
                      <input className={inputClass} value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Chauffeur's full name" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label>DL number</Label>
                        <input className={inputClass} value={driverDlNumber} onChange={(e) => setDriverDlNumber(e.target.value)} placeholder="DL-1234567" />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label>DL expiry</Label>
                        <input
                          type="date"
                          className={`${inputClass} scheme-dark`}
                          value={driverDlExpiry}
                          onChange={(e) => setDriverDlExpiry(e.target.value)}
                          min={new Date().toISOString().slice(0, 10)}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-zinc-600">
                      Expired licences are blocked at creation.
                    </p>
                  </div>
                )}
              </>
            )}

            {step === 3 && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Duration (days)</Label>
                    <input type="number" min={1} className={inputClass} value={durationDays} onChange={(e) => setDurationDays(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Rate / day (KES)</Label>
                    <input type="number" min={0} className={inputClass} value={ratePerDay} onChange={(e) => setRatePerDay(e.target.value)} />
                    {(rules.rate_floor != null || rules.rate_ceiling != null) && (
                      <span className={cn("text-xs", rateOutOfBounds ? "text-red-400" : "text-zinc-600")}>
                        Allowed: {rules.rate_floor != null ? kes(Number(rules.rate_floor)) : "any"} –{" "}
                        {rules.rate_ceiling != null ? kes(Number(rules.rate_ceiling)) : "any"}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Pickup deposit (KES)</Label>
                    <input
                      type="number"
                      min={0}
                      className={cn(inputClass, depositLocked && "opacity-60")}
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="10000"
                      readOnly={depositLocked}
                    />
                    <span className="text-xs text-zinc-600">
                      {depositLocked
                        ? "Set by the admin for this car — required to create the rental."
                        : "Required — collected when the agreement is created."}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Domicile / base</Label>
                    <input className={inputClass} value={domicile} onChange={(e) => setDomicile(e.target.value)} />
                  </div>
                  <div className="col-span-2 flex flex-col gap-2">
                    <Label>Authorized routes</Label>
                    {routeLegs.map((leg, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          className={inputClass}
                          value={leg.from}
                          onChange={(e) => setLeg(i, "from", e.target.value)}
                          placeholder="From — e.g. Nairobi"
                        />
                        <input
                          className={inputClass}
                          value={leg.to}
                          onChange={(e) => setLeg(i, "to", e.target.value)}
                          placeholder="To — e.g. Nakuru"
                        />
                        {routeLegs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setRouteLegs((legs) => legs.filter((_, idx) => idx !== i))}
                            className="flex size-8 shrink-0 items-center justify-center rounded-md border border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-white"
                          >
                            <Minus className="size-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {routeLegs.length < 5 && (
                      <button
                        type="button"
                        onClick={() => setRouteLegs((legs) => [...legs, { from: "", to: "" }])}
                        className="flex w-fit items-center gap-1.5 rounded-md border border-dashed border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-400 hover:border-zinc-500 hover:text-white"
                      >
                        <Plus className="size-3.5" />
                        Add another route
                      </button>
                    )}
                  </div>
                </div>
                <div className="rounded-md bg-zinc-900 p-3 text-sm">
                  <span className="text-zinc-500">Total: </span>
                  <span className="font-bold text-white">{kes(total)}</span>
                  <span className="text-zinc-500">
                    {" "}
                    ({durationDays || 0} × {kes(Number(ratePerDay) || 0)}) · Deposit{" "}
                    {kes(Number(depositAmount) || 0)}
                  </span>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="flex flex-col gap-2 text-sm">
                {curfewNow && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-400">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                    <span>
                      You&apos;re inside the curfew window — you can create this draft now, but
                      checkout stays locked until the window ends.
                    </span>
                  </div>
                )}
                {(
                  [
                    ["Client", client?.full_name ?? "—"],
                    ["Vehicle", car ? `${car.reg_number} · ${[car.make, car.model].filter(Boolean).join(" ")}` : "—"],
                    ["Driver", isSelfDrive ? "Self-drive" : `${driverName} (DL ${driverDlNumber})`],
                    ["Duration", `${durationDays} days`],
                    ["Rate", `${kes(Number(ratePerDay) || 0)}/day`],
                    ["Total", kes(total)],
                    ["Deposit", kes(Number(depositAmount) || 0)],
                    ["Routes", composeRouting(routeLegs) || "—"],
                    ["Domicile", domicile || "—"],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between border-b border-zinc-800/70 py-2 last:border-0">
                    <span className="text-zinc-500">{k}</span>
                    <span className="text-right text-zinc-200">{v}</span>
                  </div>
                ))}
                <p className="pt-1 text-xs text-zinc-600">
                  Creates a DRAFT agreement. Dispatch the car from the contract with
                  “Check out” — that&apos;s when the clock starts.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
        <Button
          variant="ghost"
          className={cn("text-zinc-400 hover:text-white", step === 0 && "invisible")}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={isLoading}
        >
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            className="bg-white text-black hover:bg-zinc-200"
            disabled={!canAdvance()}
            onClick={() => setStep((s) => s + 1)}
          >
            Continue
          </Button>
        ) : (
          <Button
            className="bg-white text-black hover:bg-zinc-200"
            disabled={isLoading}
            onClick={handleCreate}
          >
            {isLoading && <Loader2 className="size-4 animate-spin" />}
            Create rental
          </Button>
        )}
      </div>
    </SidePanel>
  );
}
