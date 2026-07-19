import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { getMembership } from "@/lib/auth/membership";
import { createClient } from "@/lib/supabase/server";
import { getStaffNames } from "@/lib/staff-names";
import { Button } from "@/components/ui/button";
import { VehicleStatusBadge } from "@/features/vehicles/components/vehicle-status-badge";
import { VEHICLE_COLUMNS, type Vehicle } from "@/features/vehicles/types";
import {
  VEHICLE_TRIP_COLUMNS,
  mapTrip,
  tripDisplayStatus,
  TRIP_STATUS_STYLE,
} from "@/features/vehicles/trip-history";
import { cn } from "@/lib/utils";

export const metadata = { title: "Vehicle · CarHire" };

const kes = (n: number) => `KES ${n.toLocaleString()}`;
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 py-2 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value || "—"}</span>
    </div>
  );
}

export default async function VehiclePage({
  params,
}: {
  params: Promise<{ orgId: string; vehicleId: string }>;
}) {
  const { orgId, vehicleId } = await params;
  const { membership } = await getMembership(orgId);
  const isAdmin = membership?.role === "admin" && membership.is_active === true;

  const supabase = await createClient();
  const [{ data: car }, { data: tripRows }, staffNames] = await Promise.all([
    supabase
      .from("cars")
      .select(VEHICLE_COLUMNS)
      .eq("org_id", orgId)
      .eq("id", vehicleId)
      .maybeSingle(),
    supabase
      .from("contracts")
      .select(VEHICLE_TRIP_COLUMNS)
      .eq("org_id", orgId)
      .eq("car_id", vehicleId)
      .order("created_at", { ascending: false })
      .limit(50),
    getStaffNames(supabase, orgId),
  ]);

  if (!car) notFound();
  const v = car as unknown as Vehicle;
  const trips = (tripRows ?? []).map(mapTrip);
  const title = [v.make, v.model].filter(Boolean).join(" ") || "Vehicle";
  const canRent = v.status === "AVAILABLE";

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      {/* Back */}
      <Link
        href={`/workspace/${orgId}/vehicles`}
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back to fleet
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center">
        <div className="flex items-center justify-center rounded-xl bg-muted/40 p-4 sm:size-40 sm:shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={v.image_url || "/v8.png"} alt={title} className="h-28 w-full object-contain sm:h-full" />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-tight">{title}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground">{v.reg_number}</p>
            </div>
            <VehicleStatusBadge status={v.status} />
          </div>
          <div className="flex items-end justify-between gap-3">
            <p className="text-xl font-bold">
              {v.rate_per_day != null ? kes(v.rate_per_day) : "No rate"}
              {v.rate_per_day != null && (
                <span className="text-sm font-normal text-muted-foreground"> /day</span>
              )}
            </p>
            {isAdmin && (
              <Button asChild disabled={!canRent} className={cn(!canRent && "pointer-events-none opacity-50")}>
                <Link href={`/workspace/${orgId}/rentals?new=${v.id}`}>
                  {canRent ? "Rent out now" : v.status === "TRIP" ? "On a trip" : "In maintenance"}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Details */}
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="mb-2 text-sm font-semibold">Vehicle details</h2>
          <div className="text-sm">
            <Row label="Registration" value={v.reg_number} />
            <Row label="Make / Model" value={title} />
            <Row label="Year" value={v.year} />
            <Row label="Body type" value={v.body_type} />
            <Row label="Capacity" value={v.capacity ? `${v.capacity} seats` : null} />
            <Row label="Colour" value={v.color} />
            <Row label="Transmission" value={v.transmission} />
            <Row label="Fuel" value={v.fuel_type} />
            <Row label="Engine" value={v.engine} />
            <Row label="Mileage" value={v.mileage != null ? `${v.mileage.toLocaleString()} km` : null} />
            <Row label="County" value={v.county} />
            <Row label="Domicile" value={v.domicile} />
            <Row label="Owner" value={v.owner_name} />
            <Row label="Owner phone" value={v.owner_phone} />
            <Row label="Insurance expiry" value={v.insurance_expiry ? fmtDate(v.insurance_expiry) : null} />
            <Row label="Inspection" value={v.inspection_status} />
            {v.created_by && staffNames?.[v.created_by] && (
              <Row label="Added by" value={staffNames[v.created_by]} />
            )}
          </div>
          {v.notes && (
            <div className="pt-3">
              <p className="mb-1 text-sm text-muted-foreground">Notes</p>
              <p className="text-sm">{v.notes}</p>
            </div>
          )}
        </div>

        {/* Trip history */}
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">Trip history</h2>
          {trips.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No trips recorded for this vehicle yet.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {trips.map((t) => {
                const st = tripDisplayStatus(t);
                const start = t.contract_start ?? t.created_at;
                return (
                  <Link
                    key={t.id}
                    href={`/workspace/${orgId}/rentals`}
                    className="rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{t.clientName ?? "—"}</span>
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
                      <span>{t.total_amount != null ? kes(t.total_amount) : ""}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
