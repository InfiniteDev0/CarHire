"use client";

import { useState } from "react";
import { Search, ArrowDownUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { VehicleSort } from "../filtering";

const SORT_OPTIONS: { value: VehicleSort; label: string }[] = [
  { value: "NEW", label: "Newest first" },
  { value: "RATE_ASC", label: "Rate (low → high)" },
  { value: "RATE_DESC", label: "Rate (high → low)" },
  { value: "MAKE", label: "Make (A → Z)" },
];

export function VehicleFilterTabs({
  search,
  onSearchChange,
  sort,
  onSortChange,
  onOpenFilter,
  activeFilterCount,
  isAdmin,
  onOpenAdd,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  sort: VehicleSort;
  onSortChange: (v: VehicleSort) => void;
  onOpenFilter: () => void;
  activeFilterCount: number;
  isAdmin: boolean;
  onOpenAdd: () => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="flex items-center justify-end gap-2">
      {/* Search — icon expands into an input */}
      {searchOpen || search ? (
        <Input
          autoFocus
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onBlur={() => {
            if (!search) setSearchOpen(false);
          }}
          placeholder="Search reg, make or model…"
          className="h-7 w-56 rounded-sm"
        />
      ) : (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                className="h-7 w-7 rounded-sm"
                onClick={() => setSearchOpen(true)}
              >
                <Search />
              </Button>
            }
          />
          <TooltipContent>
            <p>Search</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Sort — dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="outline" className="h-7 w-7 rounded-sm">
              <ArrowDownUp />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={sort} onValueChange={(v) => onSortChange(v as VehicleSort)}>
            {SORT_OPTIONS.map((o) => (
              <DropdownMenuRadioItem key={o.value} value={o.value}>
                {o.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Filter — your SVG, opens the filter sheet */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              className="relative h-7 w-7 rounded-sm"
              onClick={onOpenFilter}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                className="shrink-0"
              >
                <path d="M1 6L9 6" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <circle cx="15" cy="6" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                <path d="M19 14L11 14" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <path d="M2 14C2 12.3431 3.34315 11 5 11C6.65685 11 8 12.3431 8 14C8 15.6569 6.65685 17 5 17C3.34315 17 2 15.6569 2 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              </svg>
              {activeFilterCount > 0 && (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-foreground text-[9px] font-medium text-background">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          }
        />
        <TooltipContent>
          <p>Filter</p>
        </TooltipContent>
      </Tooltip>

      {/* Add — opens the form sheet */}
      {isAdmin && (
        <Button className="h-7 rounded-sm" onClick={onOpenAdd}>
          Add
        </Button>
      )}
    </div>
  );
}
