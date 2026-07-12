"use client";

import { useState } from "react";
import { X, Pencil, Archive } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SidePanel } from "./side-panel";
import { VehicleStatusBadge } from "./vehicle-status-badge";
import type { Vehicle } from "../types";

const kes = (n: number) => `KES ${n.toLocaleString()}`;

const TABS = [
  { id: "rent", label: "Rent details" },
  { id: "info", label: "Vehicle info" },
  { id: "history", label: "Trip History" },
  { id: "docs", label: "Documents" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-800/70 py-2 last:border-0">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right text-zinc-200">{value || "—"}</span>
    </div>
  );
}

export function VehicleDetailsSheet({
  vehicle,
  open,
  onOpenChange,
  isAdmin,
  onEdit,
  onDecommission,
  onRentOut,
}: {
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
  onEdit: (v: Vehicle) => void;
  onDecommission: (v: Vehicle) => void;
  onRentOut?: (v: Vehicle) => void;
}) {
  const [tab, setTab] = useState<TabId>("rent");
  // Reset to the first tab when a different vehicle is opened (render-time
  // reset — React's recommended alternative to a setState-in-effect).
  const [lastId, setLastId] = useState(vehicle?.id);
  if (vehicle?.id !== lastId) {
    setLastId(vehicle?.id);
    setTab("rent");
  }

  if (!vehicle) return null;
  const title = [vehicle.make, vehicle.model].filter(Boolean).join(" ") || "Vehicle";
  const canRent = vehicle.status === "AVAILABLE";

  return (
    <SidePanel open={open} onClose={() => onOpenChange(false)}>
      {/* Top: close + status */}
      <div className="flex items-center justify-between">
        <Button
          onClick={() => onOpenChange(false)}
          className="size-8 rounded-full bg-zinc-800 p-0 text-white hover:bg-zinc-700"
        >
          <X className="size-4" />
        </Button>
        <VehicleStatusBadge status={vehicle.status} />
      </div>

      {/* Image */}
      <div className="flex items-center justify-center py-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={vehicle.image_url || "/v8.png"} alt={title} className="h-36 object-contain" />
      </div>

      {/* Name + rate */}
      <div className="flex items-end justify-between border-b border-zinc-800 pb-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight">{title}</h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            {vehicle.engine || [vehicle.year, vehicle.body_type].filter(Boolean).join(" · ") || vehicle.reg_number}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {vehicle.rate_per_day != null ? (
            <p className="text-xl font-bold">
              {kes(vehicle.rate_per_day)}
              <span className="text-xs font-normal text-zinc-500"> /day</span>
            </p>
          ) : (
            <p className="text-xs text-zinc-500">No rate</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 overflow-x-auto border-b border-zinc-800 pb-px no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative whitespace-nowrap pb-2 text-sm font-medium transition-colors",
              tab === t.id ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {t.label}
            {tab === t.id && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-white" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 text-sm text-zinc-400">
        {tab === "rent" && (
          <div className="space-y-5">
            <div className="rounded-md bg-zinc-900 p-3">
              <p className="text-xs text-zinc-500">Daily rate</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {vehicle.rate_per_day != null ? kes(vehicle.rate_per_day) : "—"}
                <span className="text-sm font-normal text-zinc-500"> /day</span>
              </p>
            </div>
            <Button
              className="w-full rounded-sm"
              disabled={!canRent}
              onClick={() => onRentOut?.(vehicle)}
            >
              {canRent ? "Rent out now" : `Unavailable · ${vehicle.status === "TRIP" ? "on a trip" : "in maintenance"}`}
            </Button>
            <p className="text-center text-xs text-zinc-600">
              Opens the new-rental flow with this car preselected.
            </p>
          </div>
        )}

        {tab === "info" && (
          <div>
            <InfoRow label="Registration" value={vehicle.reg_number} />
            <InfoRow label="Make / Model" value={title} />
            <InfoRow label="Year" value={vehicle.year} />
            <InfoRow label="Body type" value={vehicle.body_type} />
            <InfoRow label="Capacity" value={vehicle.capacity ? `${vehicle.capacity} seats` : null} />
            <InfoRow label="Colour" value={vehicle.color} />
            <InfoRow label="Transmission" value={vehicle.transmission} />
            <InfoRow label="Fuel" value={vehicle.fuel_type} />
            <InfoRow label="Engine" value={vehicle.engine} />
            <InfoRow label="County" value={vehicle.county} />
            <InfoRow label="Domicile" value={vehicle.domicile} />
            {(vehicle.owner_name || vehicle.num_owners != null) && (
              <>
                <InfoRow label="Owner" value={vehicle.owner_name} />
                <InfoRow label="No. of owners" value={vehicle.num_owners} />
              </>
            )}
            {vehicle.notes && (
              <div className="pt-3">
                <p className="mb-1 text-zinc-500">Notes</p>
                <p className="text-zinc-300">{vehicle.notes}</p>
              </div>
            )}
          </div>
        )}

        {tab === "history" && (
          <div>
            <InfoRow label="Total mileage" value={vehicle.mileage != null ? `${vehicle.mileage.toLocaleString()} km` : null} />
            <div className="flex min-h-24 items-center justify-center pt-4 text-center text-xs text-zinc-600">
              Trip history appears here once contracts exist (Phase 4/5).
            </div>
          </div>
        )}

        {tab === "docs" && (
          <div>
            <InfoRow
              label="Insurance expiry"
              value={vehicle.insurance_expiry ? new Date(vehicle.insurance_expiry).toLocaleDateString() : null}
            />
            <InfoRow label="Inspection" value={vehicle.inspection_status} />
          </div>
        )}
      </div>

      {/* Admin actions */}
      {isAdmin && (
        <div className="flex gap-2 border-t border-zinc-800 pt-3">
          <Button
            variant="outline"
            className="flex-1 border-zinc-700 bg-transparent text-red-400 hover:bg-zinc-900"
            onClick={() => onDecommission(vehicle)}
          >
            <Archive className="size-4" />
            Decommission
          </Button>
          <Button className="flex-1" onClick={() => onEdit(vehicle)}>
            <Pencil className="size-4" />
            Edit
          </Button>
        </div>
      )}
    </SidePanel>
  );
}
