"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Pencil, Archive, Maximize2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { SidePanel } from "./side-panel";
import { VehicleStatusBadge } from "./vehicle-status-badge";
import type { Vehicle } from "../types";
import {
  VEHICLE_TRIP_COLUMNS,
  mapTrip,
  tripDisplayStatus,
  TRIP_STATUS_STYLE,
  type VehicleTrip,
} from "../trip-history";
import { money } from "@/lib/money";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });

const TABS = [
  { id: "rent", label: "Rent details" },
  { id: "info", label: "Vehicle info" },
  { id: "history", label: "Trip History" },
  { id: "docs", label: "Documents" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b  py-2 last:border-0">
      <span className="text-black dark:text-muted-foreground">{label}</span>
      <span className="text-right dark:text-foreground">{value || "—"}</span>
    </div>
  );
}

export function VehicleDetailsSheet({
  orgId,
  vehicle,
  open,
  onOpenChange,
  isAdmin,
  onEdit,
  onDecommission,
  onRentOut,
  staffNames,
}: {
  orgId: string;
  vehicle: Vehicle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAdmin: boolean;
  onEdit: (v: Vehicle) => void;
  onDecommission: (v: Vehicle) => void;
  onRentOut?: (v: Vehicle) => void;
  staffNames?: Record<string, string>;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("rent");
  const [trips, setTrips] = useState<VehicleTrip[] | null>(null);
  const [tripsLoading, setTripsLoading] = useState(false);

  // Reset to the first tab (and drop cached trips) when a different vehicle is
  // opened (render-time reset — React's alternative to a setState-in-effect).
  const [lastId, setLastId] = useState(vehicle?.id);
  if (vehicle?.id !== lastId) {
    setLastId(vehicle?.id);
    setTab("rent");
    setTrips(null);
  }

  // Lazily load the trip history the first time that tab is opened.
  const vehicleId = vehicle?.id;
  useEffect(() => {
    if (!open || tab !== "history" || !vehicleId || trips !== null) return;
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setTripsLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("contracts")
        .select(VEHICLE_TRIP_COLUMNS)
        .eq("org_id", orgId)
        .eq("car_id", vehicleId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (cancelled) return;
      setTrips((data ?? []).map(mapTrip));
      setTripsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, tab, vehicleId, trips, orgId]);

  if (!vehicle) return null;
  const title = [vehicle.make, vehicle.model].filter(Boolean).join(" ") || "Vehicle";
  const canRent = vehicle.status === "AVAILABLE";

  return (
    <SidePanel open={open} onClose={() => onOpenChange(false)}>
      {/* Top: close + expand + status */}
      <div className="flex items-center justify-between">
        <Button
          onClick={() => onOpenChange(false)}
          className="size-8 rounded-full bg-muted p-0 text-foreground hover:bg-muted"
        >
          <X className="size-4" />
        </Button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Open full page"
            onClick={() => router.push(`/workspace/${orgId}/vehicles/${vehicle.id}`)}
            className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-muted text-foreground transition-colors hover:bg-muted"
          >
            <Maximize2 className="size-3.5" />
          </button>
          <VehicleStatusBadge status={vehicle.status} />
        </div>
      </div>

      {/* Image */}
      <div className="flex items-center justify-center py-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={vehicle.image_url || "/v8.png"} alt={title} className="h-36 object-contain" />
      </div>

      {/* Name + rate */}
      <div className="flex items-end justify-between border-b dark:border-border">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight">{title}</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {vehicle.engine || [vehicle.year, vehicle.body_type].filter(Boolean).join(" · ") || vehicle.reg_number}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {vehicle.rate_per_day != null ? (
            <p className="text-xl font-bold">
              {money(vehicle.rate_per_day)}
              <span className="text-xs font-normal text-muted-foreground"> /day</span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">No rate</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex  items-center gap-4 border-b dark:border-border pb-px no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative whitespace-nowrap pb-2 text-sm font-medium transition-colors",
              tab === t.id ? "text-foreground" : "text-muted-foreground md:hover:text-foreground"
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
      <div className="flex-1 overflow-y-scroll scrollbar-pill px-2  text-sm text-muted-foreground">
        {tab === "rent" && (
          <div className="space-y-5">
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs text-muted-foreground">Daily rate</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {vehicle.rate_per_day != null ? money(vehicle.rate_per_day) : "—"}
                <span className="text-sm font-normal text-muted-foreground"> /day</span>
              </p>
            </div>
            <Button
              className="w-full rounded-sm"
              disabled={!canRent}
              onClick={() => onRentOut?.(vehicle)}
            >
              {canRent ? "Rent out now" : `Unavailable · ${vehicle.status === "TRIP" ? "on a trip" : "in maintenance"}`}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
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
                <InfoRow label="Owner phone" value={vehicle.owner_phone} />
                <InfoRow label="No. of owners" value={vehicle.num_owners} />
              </>
            )}
            {vehicle.created_by && staffNames?.[vehicle.created_by] && (
              <InfoRow label="Added by" value={staffNames[vehicle.created_by]} />
            )}
            {vehicle.notes && (
              <div className="pt-3">
                <p className="mb-1 text-muted-foreground">Notes</p>
                <p className="text-foreground">{vehicle.notes}</p>
              </div>
            )}
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-3">
            <InfoRow label="Total mileage" value={vehicle.mileage != null ? `${vehicle.mileage.toLocaleString()} km` : null} />

            {tripsLoading && (
              <div className="flex justify-center py-6">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              </div>
            )}

            {!tripsLoading && trips && trips.length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No trips recorded for this vehicle yet.
              </p>
            )}

            {!tripsLoading && trips && trips.length > 0 && (
              <div className="flex flex-col gap-2">
                {trips.map((t) => {
                  const st = tripDisplayStatus(t);
                  const start = t.contract_start ?? t.created_at;
                  return (
                    <div key={t.id} className="rounded-lg border border-border p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {t.clientName ?? "—"}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                            TRIP_STATUS_STYLE[st]
                          )}
                        >
                          {st}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {fmtDate(start)} · {t.duration_days} day{t.duration_days === 1 ? "" : "s"}
                        </span>
                        <span>{t.total_amount != null ? money(t.total_amount) : ""}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
        <div className="flex flex-col gap-1.5 border-t border-border pt-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 bg-transparent text-red-600 dark:text-red-400 hover:bg-muted disabled:opacity-40"
              disabled={vehicle.status === "TRIP"}
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
          {vehicle.status === "TRIP" && (
            <p className="text-center text-xs text-muted-foreground">
              On a trip — check it in before decommissioning.
            </p>
          )}
        </div>
      )}
    </SidePanel>
  );
}
