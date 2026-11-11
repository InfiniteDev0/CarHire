"use client";

import { X, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BODY_TYPES, TRANSMISSIONS, FUEL_TYPES, CAR_STATUSES, type CarStatus } from "@/lib/validation/car";
import { SidePanel } from "./side-panel";
import { EMPTY_FILTERS, type VehicleFilters } from "../filtering";

const STATUS_LABELS: Record<CarStatus, string> = {
  AVAILABLE: "Available",
  TRIP: "On trip",
  MAINTENANCE: "Maintenance",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border pb-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md border px-3 py-1.5 text-sm transition-colors",
            value === o.value
              ? "border-white bg-white text-black"
              : "border-border text-foreground hover:border-border"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function CheckboxGrid({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className="flex items-center gap-2 text-left text-sm text-foreground"
          >
            <span
              className={cn(
                "flex size-4 items-center justify-center rounded border",
                on ? "border-white bg-white text-black" : "border-border"
              )}
            >
              {on && <Check className="size-3" strokeWidth={3} />}
            </span>
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function FilterSheet({
  open,
  onOpenChange,
  filters,
  onChange,
  resultCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: VehicleFilters;
  onChange: (f: VehicleFilters) => void;
  resultCount: number;
}) {
  const patch = (p: Partial<VehicleFilters>) => onChange({ ...filters, ...p });
  const toggle = (key: "bodyTypes" | "fuelTypes", v: string) => {
    const arr = filters[key];
    patch({ [key]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] });
  };

  return (
    <SidePanel open={open} onClose={() => onOpenChange(false)}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filter by</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Reset all
          </button>
          <Button
            onClick={() => onOpenChange(false)}
            className="size-8 rounded-full bg-muted p-0 text-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4">
        <Section title="Status">
          <Segmented<"ALL" | CarStatus>
            value={filters.status}
            onChange={(v) => patch({ status: v })}
            options={[
              { value: "ALL", label: "Any" },
              ...CAR_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
            ]}
          />
        </Section>

        <Section title="Body type">
          <CheckboxGrid options={BODY_TYPES} selected={filters.bodyTypes} onToggle={(v) => toggle("bodyTypes", v)} />
        </Section>

        <Section title="Transmission">
          <Segmented
            value={filters.transmission}
            onChange={(v) => patch({ transmission: v })}
            options={[{ value: "", label: "Any" }, ...TRANSMISSIONS.map((t) => ({ value: t, label: t }))]}
          />
        </Section>

        <Section title="Fuel type">
          <CheckboxGrid options={FUEL_TYPES} selected={filters.fuelTypes} onToggle={(v) => toggle("fuelTypes", v)} />
        </Section>

        <Section title="Price range / day (USD)">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={filters.minRate}
              onChange={(e) => patch({ minRate: e.target.value })}
              placeholder="Min"
              className="h-9 w-full rounded-md border border-border bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-border"
            />
            <span className="text-muted-foreground">–</span>
            <input
              type="number"
              value={filters.maxRate}
              onChange={(e) => patch({ maxRate: e.target.value })}
              placeholder="Max"
              className="h-9 w-full rounded-md border border-border bg-muted px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-border"
            />
          </div>
        </Section>
      </div>

      <Button className="w-full rounded-sm" onClick={() => onOpenChange(false)}>
        Show {resultCount} {resultCount === 1 ? "vehicle" : "vehicles"}
      </Button>
    </SidePanel>
  );
}
