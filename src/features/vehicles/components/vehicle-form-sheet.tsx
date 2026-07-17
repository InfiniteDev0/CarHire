"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KENYA_COUNTIES } from "@/features/onboarding/data/counties";
import {
  carSchema,
  CAR_STATUSES,
  BODY_TYPES,
  TRANSMISSIONS,
  FUEL_TYPES,
  INSPECTION_STATUSES,
  type CarStatus,
} from "@/lib/validation/car";
import { createCar, updateCar } from "../actions";
import { SidePanel } from "./side-panel";
import type { Vehicle } from "../types";

const STATUS_LABELS: Record<CarStatus, string> = {
  AVAILABLE: "Available",
  TRIP: "On trip",
  MAINTENANCE: "Maintenance",
};
const CAPACITY_OPTIONS = ["2", "4", "5", "7", "8", "14"];
// Radix Select forbids empty-string item values — use a sentinel for "none".
const NONE = "__none";

interface FormState {
  regNumber: string;
  make: string;
  model: string;
  year: string;
  capacity: string;
  status: CarStatus;
  county: string;
  domicile: string;
  color: string;
  bodyType: string;
  transmission: string;
  fuelType: string;
  engine: string;
  mileage: string;
  ratePerDay: string;
  deposit: string;
  imageUrl: string;
  ownerName: string;
  ownerPhone: string;
  numOwners: string;
  insuranceExpiry: string;
  inspectionStatus: string;
  notes: string;
}

function initialFrom(v: Vehicle | null): FormState {
  const s = (x: unknown) => (x != null ? String(x) : "");
  return {
    regNumber: v?.reg_number ?? "",
    make: v?.make ?? "",
    model: v?.model ?? "",
    year: s(v?.year),
    capacity: s(v?.capacity),
    status: v?.status ?? "AVAILABLE",
    county: v?.county ?? "",
    domicile: v?.domicile ?? "",
    color: v?.color ?? "",
    bodyType: v?.body_type ?? "",
    transmission: v?.transmission ?? "",
    fuelType: v?.fuel_type ?? "",
    engine: v?.engine ?? "",
    mileage: s(v?.mileage),
    ratePerDay: s(v?.rate_per_day),
    deposit: s(v?.deposit),
    imageUrl: v?.image_url ?? "",
    ownerName: v?.owner_name ?? "",
    ownerPhone: v?.owner_phone ?? "",
    numOwners: s(v?.num_owners),
    insuranceExpiry: v?.insurance_expiry ?? "",
    inspectionStatus: v?.inspection_status ?? "",
    notes: v?.notes ?? "",
  };
}

/** Optional select that maps the sentinel back to "" for storage. */
function OptionalSelect({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Select
        value={value || NONE}
        onValueChange={(v) => onChange(v === NONE ? "" : v)}
        disabled={disabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>—</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function VehicleFormSheet({
  orgId,
  editing,
  open,
  onOpenChange,
}: {
  orgId: string;
  editing: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => initialFrom(editing));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Re-seed the form whenever the sheet opens (render-time reset, no effect).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm(initialFrom(editing));
      setErrors({});
    }
  }

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) return;

    const result = carSchema.safeParse(form);
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !errs[key]) errs[key] = issue.message;
      }
      setErrors(errs);
      return;
    }
    setErrors({});

    setIsLoading(true);
    try {
      if (editing) {
        await updateCar(orgId, editing.id, form);
        toast.success("Vehicle updated");
      } else {
        await createCar(orgId, form);
        toast.success("Vehicle added");
      }
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{editing ? "Edit vehicle" : "Add a vehicle"}</h2>
        <Button
          onClick={() => onOpenChange(false)}
          className="size-8 rounded-full bg-zinc-800 p-0 text-white hover:bg-zinc-700"
        >
          <X className="size-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-1 flex-col gap-4">
        {/* Basics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="regNumber">Registration *</Label>
            <Input id="regNumber" value={form.regNumber} onChange={(e) => set("regNumber", e.target.value)} placeholder="KDA 421J" disabled={isLoading} aria-invalid={!!errors.regNumber} />
            {errors.regNumber && <span className="text-xs text-red-400">{errors.regNumber}</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="make">Make *</Label>
            <Input id="make" value={form.make} onChange={(e) => set("make", e.target.value)} placeholder="Toyota" disabled={isLoading} aria-invalid={!!errors.make} />
            {errors.make && <span className="text-xs text-red-400">{errors.make}</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="model">Model *</Label>
            <Input id="model" value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="Land Cruiser" disabled={isLoading} aria-invalid={!!errors.model} />
            {errors.model && <span className="text-xs text-red-400">{errors.model}</span>}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="year">Year</Label>
            <Input id="year" type="number" value={form.year} onChange={(e) => set("year", e.target.value)} placeholder="2021" disabled={isLoading} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set("status", v as CarStatus)} disabled={isLoading}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CAR_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Classification */}
        <div className="grid grid-cols-2 gap-3">
          <OptionalSelect label="Body type" value={form.bodyType} onChange={(v) => set("bodyType", v)} options={BODY_TYPES} disabled={isLoading} />
          <OptionalSelect label="Transmission" value={form.transmission} onChange={(v) => set("transmission", v)} options={TRANSMISSIONS} disabled={isLoading} />
          <OptionalSelect label="Fuel type" value={form.fuelType} onChange={(v) => set("fuelType", v)} options={FUEL_TYPES} disabled={isLoading} />
          <OptionalSelect label="Capacity" value={form.capacity} onChange={(v) => set("capacity", v)} options={CAPACITY_OPTIONS} disabled={isLoading} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="color">Colour</Label>
            <Input id="color" value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="Metallic black" disabled={isLoading} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="engine">Engine</Label>
            <Input id="engine" value={form.engine} onChange={(e) => set("engine", e.target.value)} placeholder="2.0L Turbo" disabled={isLoading} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mileage">Mileage (km)</Label>
            <Input id="mileage" type="number" value={form.mileage} onChange={(e) => set("mileage", e.target.value)} placeholder="45350" disabled={isLoading} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ratePerDay">Rate / day (KES)</Label>
            <Input id="ratePerDay" type="number" value={form.ratePerDay} onChange={(e) => set("ratePerDay", e.target.value)} placeholder="3500" disabled={isLoading} />
          </div>
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor="deposit">Pickup deposit (KES)</Label>
            <Input id="deposit" type="number" value={form.deposit} onChange={(e) => set("deposit", e.target.value)} placeholder="10000" disabled={isLoading} />
            <span className="text-xs text-zinc-600">
              Collected when a rental for this car is created. Admin-only.
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="grid grid-cols-2 gap-3">
          <OptionalSelect label="County" value={form.county} onChange={(v) => set("county", v)} options={KENYA_COUNTIES} disabled={isLoading} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="domicile">Domicile / base</Label>
            <Input id="domicile" value={form.domicile} onChange={(e) => set("domicile", e.target.value)} placeholder="Nairobi Base" disabled={isLoading} />
          </div>
        </div>

        {/* Ownership + documents */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ownerName">Owner name</Label>
            <Input id="ownerName" value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} placeholder="Company / person" disabled={isLoading} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ownerPhone">Owner phone</Label>
            <Input id="ownerPhone" type="tel" value={form.ownerPhone} onChange={(e) => set("ownerPhone", e.target.value)} placeholder="+254 7XX XXX XXX" disabled={isLoading} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="numOwners">No. of owners</Label>
            <Input id="numOwners" type="number" value={form.numOwners} onChange={(e) => set("numOwners", e.target.value)} placeholder="1" disabled={isLoading} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="insuranceExpiry">Insurance expiry</Label>
            <Input id="insuranceExpiry" type="date" className="scheme-dark" value={form.insuranceExpiry} onChange={(e) => set("insuranceExpiry", e.target.value)} disabled={isLoading} />
          </div>
          <OptionalSelect label="Inspection" value={form.inspectionStatus} onChange={(v) => set("inspectionStatus", v)} options={INSPECTION_STATUSES} disabled={isLoading} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Anything worth flagging…" disabled={isLoading} />
        </div>

        <Button type="submit" className="mt-auto w-full rounded-sm" disabled={isLoading}>
          {isLoading && <Loader2 className="size-4 animate-spin" />}
          {editing ? "Save changes" : "Add vehicle"}
        </Button>
      </form>
    </SidePanel>
  );
}
