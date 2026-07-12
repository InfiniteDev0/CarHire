"use client";

import { ListFilter, ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { RentalStatus } from "@/lib/constants/rentals";

export type StatusFilter = "ALL" | RentalStatus;
export type SortKey = "DUE" | "RATE" | "CLIENT";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All rentals" },
  { value: "ACTIVE", label: "Active" },
  { value: "DUE_SOON", label: "Due soon" },
  { value: "OVERDUE", label: "Overdue" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "DUE", label: "Due date (soonest)" },
  { value: "RATE", label: "Rate (high → low)" },
  { value: "CLIENT", label: "Client (A → Z)" },
];

interface RentalsFilterSortProps {
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  sort: SortKey;
  onSortChange: (value: SortKey) => void;
}

export function RentalsFilterSort({
  status,
  onStatusChange,
  sort,
  onSortChange,
}: RentalsFilterSortProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" className="h-7 gap-1.5 rounded-sm text-xs">
              <ListFilter className="size-3.5" />
              Filter
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel>Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={status}
            onValueChange={(value) => onStatusChange(value as StatusFilter)}
          >
            {STATUS_OPTIONS.map((opt) => (
              <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                {opt.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Sort */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" size="icon-sm" className="size-7 rounded-sm">
              <ArrowUpDown className="size-3.5" />
              <span className="sr-only">Sort rentals</span>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={sort}
            onValueChange={(value) => onSortChange(value as SortKey)}
          >
            {SORT_OPTIONS.map((opt) => (
              <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                {opt.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
