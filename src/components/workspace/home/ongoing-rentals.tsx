"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Rental } from "@/lib/constants/rentals";
import { RentalsDataTable } from "@/components/workspace/vehicles/rentals/rentals-data-table";
import {
  RentalsFilterSort,
  type SortKey,
  type StatusFilter,
} from "@/components/workspace/vehicles/rentals/widgets/rentals-filter-sort";

export function OngoingRentals({
  orgId,
  rentals,
}: {
  orgId: string;
  rentals: Rental[];
}) {
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [sort, setSort] = useState<SortKey>("DUE");

  const rows = useMemo(() => {
    const filtered =
      status === "ALL" ? rentals : rentals.filter((r) => r.status === status);

    return [...filtered].sort((a, b) => {
      if (sort === "RATE") return b.ratePerDay - a.ratePerDay;
      if (sort === "CLIENT") return a.clientName.localeCompare(b.clientName);
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(); // DUE
    });
  }, [rentals, status, sort]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm">
          <Clock className="size-4" />
          <p>Ongoing Rentals</p>
        </div>

        <div className="flex items-center gap-2">
          <RentalsFilterSort
            status={status}
            onStatusChange={setStatus}
            sort={sort}
            onSortChange={setSort}
          />
          <Button asChild className="h-7 rounded-sm">
            <Link href={`/workspace/${orgId}/rentals`}>Manage Rentals</Link>
          </Button>
        </div>
      </div>

      <RentalsDataTable data={rows} orgId={orgId} />
    </div>
  );
}
