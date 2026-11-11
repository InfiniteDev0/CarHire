"use client";

/** Toolbar tools for list pages: sort menu, toolbar buttons, row selection and CSV export. */

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ArrowDownUp, Check, Download, X } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const TOOL =
  "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

/** Labelled ghost button for the toolbar (Sort, Filter, Columns). */
export function ToolbarButton({
  icon,
  label,
  count,
  active = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  /** Shown as a tiny black box, e.g. the number of filters applied. */
  count?: number;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={cn(TOOL, active && "bg-muted text-foreground")}>
      <span className="[&_svg]:size-4">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
      {!!count && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-[4px] bg-foreground px-1 text-[10px] font-semibold text-background">
          {count}
        </span>
      )}
    </button>
  );
}

/** "Sort" toolbar button with a radio menu of orderings. */
export function SortMenu<T extends string>({
  options,
  value,
  onChange,
  defaultValue,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  /** The ordering that counts as "not sorted"; any other shows as active. */
  defaultValue?: T;
}) {
  const active = defaultValue != null && value !== defaultValue;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button type="button" className={cn(TOOL, active && "bg-muted text-foreground")}>
            <ArrowDownUp className="size-4" />
            <span className="hidden sm:inline">Sort</span>
          </button>
        }
      />
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={value} onValueChange={(v) => onChange(v as T)}>
          {options.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value}>
              {o.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── Row selection ───────────────────────────────────────────────────────── */

/** Tracks ticked row ids for a list. */
export function useSelection(visibleIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  const clear = useCallback(() => setSelected(new Set()), []);

  // Only rows that are still showing count as selected.
  const ids = useMemo(() => visibleIds.filter((id) => selected.has(id)), [visibleIds, selected]);
  const allSelected = visibleIds.length > 0 && ids.length === visibleIds.length;
  const toggleAll = useCallback(() => {
    setSelected(allSelected ? new Set() : new Set(visibleIds));
  }, [allSelected, visibleIds]);

  return { ids, count: ids.length, has: (id: string) => selected.has(id), toggle, toggleAll, allSelected, clear };
}

/** Square tick box for table rows. Stops the row click from firing. */
export function RowCheck({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={cn(
        "flex size-[18px] items-center justify-center rounded-[5px] border transition-colors",
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-muted-foreground/40 hover:border-foreground",
      )}
    >
      {checked && <Check className="size-3" strokeWidth={3} />}
    </button>
  );
}

/** Slides down above the table while rows are ticked. */
export function SelectionBar({
  count,
  onClear,
  children,
}: {
  count: number;
  onClear: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
        count > 0 ? "grid-rows-[1fr] opacity-100" : "-mt-4 grid-rows-[0fr] opacity-0",
      )}
      aria-hidden={count === 0}
    >
      <div className="overflow-hidden">
        <div className="flex items-center gap-2 rounded-xl bg-card p-2">
          <span className="px-2 text-sm">
            <span className="font-semibold tabular-nums">{count}</span> selected
          </span>
          <div className="ml-auto flex items-center gap-2">{children}</div>
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear selection"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Filled action button used inside the selection bar. */
export function SelectionAction({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-muted px-3 text-sm font-medium transition-colors hover:bg-muted-foreground/20 active:translate-y-px"
    >
      <span className="[&_svg]:size-4">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function ExportAction({ onClick }: { onClick: () => void }) {
  return <SelectionAction icon={<Download />} label="Export" onClick={onClick} />;
}

/** Download rows as a CSV file (opens in Excel / Sheets). */
export function exportCsv(filename: string, header: string[], rows: (string | number | null | undefined)[][]) {
  const cell = (v: string | number | null | undefined) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [header, ...rows].map((r) => r.map(cell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
