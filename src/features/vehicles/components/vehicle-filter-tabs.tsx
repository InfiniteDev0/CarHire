"use client";

import { Plus, SlidersHorizontal } from "lucide-react";

import {
  ActionTray,
  ListToolbar,
  PRIMARY_ACTION,
  TableSearch,
} from "@/components/workspace/list";
import { SortMenu, ToolbarButton } from "@/components/workspace/list/tools";
import type { VehicleSort } from "../filtering";

const SORT_OPTIONS: { value: VehicleSort; label: string }[] = [
  { value: "NEW", label: "Newest first" },
  { value: "RATE_ASC", label: "Rate (low → high)" },
  { value: "RATE_DESC", label: "Rate (high → low)" },
  { value: "MAKE", label: "Make (A → Z)" },
];

/** The Vehicles toolbar: search, Sort, Filter and the add button. */
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
  return (
    <ListToolbar>
      <TableSearch value={search} onChange={onSearchChange} placeholder="Search reg, make or model" />
      <SortMenu options={SORT_OPTIONS} value={sort} onChange={onSortChange} defaultValue="NEW" />
      <ToolbarButton
        icon={<SlidersHorizontal />}
        label="Filter"
        count={activeFilterCount}
        active={activeFilterCount > 0}
        onClick={onOpenFilter}
      />
      {isAdmin && (
        <ActionTray>
          <button type="button" className={PRIMARY_ACTION} onClick={onOpenAdd}>
            <Plus className="size-4" />
            Add vehicle
          </button>
        </ActionTray>
      )}
    </ListToolbar>
  );
}
