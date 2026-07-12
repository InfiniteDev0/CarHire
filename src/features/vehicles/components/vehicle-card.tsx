"use client";

import { Pencil } from "lucide-react";
import { VehicleStatusBadge } from "./vehicle-status-badge";
import type { Vehicle } from "../types";

const kes = (n: number) => `KES ${n.toLocaleString()}`;

export function VehicleCard({
  vehicle,
  onOpen,
  isAdmin,
  onEdit,
}: {
  vehicle: Vehicle;
  onOpen: (v: Vehicle) => void;
  isAdmin: boolean;
  onEdit: (v: Vehicle) => void;
}) {
  const spec =
    vehicle.engine ||
    [
      vehicle.year,
      vehicle.body_type,
      vehicle.fuel_type,
      vehicle.capacity ? `${vehicle.capacity} seats` : null,
    ]
      .filter(Boolean)
      .join(" · ");

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
      {/* Overlay: status + admin edit */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between p-2">
        <VehicleStatusBadge status={vehicle.status} />
        {isAdmin && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(vehicle);
            }}
            className="rounded-full bg-background/70 p-1.5 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
            aria-label="Edit vehicle"
          >
            <Pencil className="size-3.5" />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onOpen(vehicle)}
        className="w-full text-left"
      >
        {/* Image (falls back to placeholder art) */}
        <div className="flex aspect-[16/10] items-center justify-center bg-muted/40 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={vehicle.image_url || "/v8.png"}
            alt={[vehicle.make, vehicle.model].filter(Boolean).join(" ") || "Vehicle"}
            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <div className="flex items-end justify-between gap-3 p-3">
          <div className="min-w-0">
            <p className="truncate font-medium">
              {[vehicle.make, vehicle.model].filter(Boolean).join(" ") || "Vehicle"}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {vehicle.reg_number}
              {spec ? ` · ${spec}` : ""}
            </p>
          </div>
          <div className="shrink-0 text-right">
            {vehicle.rate_per_day != null ? (
              <p className="font-semibold">
                {kes(vehicle.rate_per_day)}
                <span className="text-xs font-normal text-muted-foreground"> /day</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">No rate</p>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}
