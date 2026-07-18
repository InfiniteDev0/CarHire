"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Car } from "lucide-react";
import { toast } from "sonner";

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
import { decommissionCar } from "../actions";
import type { Vehicle } from "../types";
import {
  EMPTY_FILTERS,
  filterVehicles,
  sortVehicles,
  activeFilterCount,
  type VehicleFilters,
  type VehicleSort,
} from "../filtering";
import { VehicleCard } from "./vehicle-card";
import { VehicleFilterTabs } from "./vehicle-filter-tabs";
import { FilterSheet } from "./filter-sheet";
import { VehicleDetailsSheet } from "./vehicle-details-sheet";
import { VehicleFormSheet } from "./vehicle-form-sheet";

export function VehiclesGrid({
  orgId,
  isAdmin,
  cars,
  staffNames,
  openFormOnLoad = false,
}: {
  orgId: string;
  isAdmin: boolean;
  cars: Vehicle[];
  staffNames?: Record<string, string>;
  openFormOnLoad?: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<VehicleSort>("NEW");
  const [filters, setFilters] = useState<VehicleFilters>(EMPTY_FILTERS);

  const [detailsTarget, setDetailsTarget] = useState<Vehicle | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(openFormOnLoad);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [decommissionTarget, setDecommissionTarget] = useState<Vehicle | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () => sortVehicles(filterVehicles(cars, search, filters), sort),
    [cars, search, filters, sort]
  );

  function openDetails(v: Vehicle) {
    setDetailsTarget(v);
    setDetailsOpen(true);
  }
  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(v: Vehicle) {
    setDetailsOpen(false);
    setEditing(v);
    setFormOpen(true);
  }
  function askDecommission(v: Vehicle) {
    setDetailsOpen(false);
    setDecommissionTarget(v);
  }
  function confirmDecommission() {
    const target = decommissionTarget;
    if (!target) return;
    startTransition(async () => {
      try {
        await decommissionCar(orgId, target.id);
        toast.success(`${target.reg_number} decommissioned`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        setDecommissionTarget(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <VehicleFilterTabs
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        onOpenFilter={() => setFilterOpen(true)}
        activeFilterCount={activeFilterCount(filters)}
        isAdmin={isAdmin}
        onOpenAdd={openAdd}
      />

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex min-h-60 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center">
          <Car className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {cars.length === 0
              ? "No vehicles yet. Add your first car to the fleet."
              : "No vehicles match these filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ">
          {filtered.map((v) => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              onOpen={openDetails}
              isAdmin={isAdmin}
              onEdit={openEdit}
            />
          ))}
        </div>
      )}

      {/* Details */}
      <VehicleDetailsSheet
        vehicle={detailsTarget}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        isAdmin={isAdmin}
        staffNames={staffNames}
        onEdit={openEdit}
        onDecommission={askDecommission}
        onRentOut={(v) => router.push(`/workspace/${orgId}/rentals?new=${v.id}`)}
      />

      {/* Filters */}
      <FilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onChange={setFilters}
        resultCount={filtered.length}
      />

      {/* Add / edit */}
      {isAdmin && (
        <VehicleFormSheet
          orgId={orgId}
          editing={editing}
          open={formOpen}
          onOpenChange={setFormOpen}
        />
      )}

      {/* Decommission confirm */}
      <AlertDialog
        open={!!decommissionTarget}
        onOpenChange={(o) => !o && setDecommissionTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decommission this vehicle?</AlertDialogTitle>
            <AlertDialogDescription>
              {decommissionTarget?.reg_number} will be removed from the active fleet.
              Its trip history is kept, and it won&apos;t appear in the inventory anymore.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDecommission();
              }}
              disabled={isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Decommission
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
