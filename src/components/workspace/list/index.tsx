"use client";

/**
 * Shared building blocks for list pages, so every module follows the same
 * anatomy: heading → toolbar → (folder tabs) → table or cards → totals strip.
 */

import type { CSSProperties, ReactNode } from "react";
import { Check, LayoutGrid, Search, SearchX, Table2, X } from "lucide-react";

import { cn } from "@/lib/utils";

/* ── Heading ─────────────────────────────────────────────────────────────── */

export function PageHeading({
  title,
  description,
  count,
  noun,
  children,
}: {
  title: string;
  description?: string;
  /** Number of records showing; rendered as "128 students". */
  count?: number;
  /** Singular noun for the count, e.g. "client". */
  noun?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 hidden max-w-3xl text-sm text-muted-foreground md:block">{description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3 text-sm text-muted-foreground">
        {count != null && noun && (
          <span>
            <span className="font-medium tabular-nums text-foreground">{count.toLocaleString("en-US")}</span>{" "}
            {count === 1 ? noun : `${noun}s`}
          </span>
        )}
        {children}
      </div>
    </div>
  );
}

/* ── Toolbar ─────────────────────────────────────────────────────────────── */

/** Sticks to the top of the scrolling panel, on the canvas colour. */
export function ListToolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "sticky top-0 z-20 -mx-4 flex flex-wrap items-center gap-2 bg-canvas px-4 py-2 md:-top-6 lg:-mx-6 lg:px-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Borderless search box with a clear button; Esc clears it. */
export function TableSearch({
  value,
  onChange,
  placeholder = "Search…",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative min-w-40 flex-1 md:max-w-xs", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onChange("");
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-full rounded-lg bg-card pl-9 pr-8 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

/** The grey tray on the right of a toolbar that holds the view switch and the primary action. */
export function ActionTray({ children }: { children: ReactNode }) {
  return (
    <div className="ml-auto flex items-center gap-1 rounded-xl bg-black/[0.06] p-1 ring-1 ring-black/[0.06] dark:bg-white/[0.06] dark:ring-white/[0.06]">
      {children}
    </div>
  );
}

export function TrayDivider() {
  return <span className="mx-0.5 h-5 w-px bg-black/10 dark:bg-white/15" />;
}

export type ListView = "table" | "cards";

/** Table / Cards switch. Desktop only — phones always show cards. */
export function ViewSwitch({ view, onChange }: { view: ListView; onChange: (v: ListView) => void }) {
  const options = [
    { id: "table" as const, label: "Table", icon: Table2 },
    { id: "cards" as const, label: "Cards", icon: LayoutGrid },
  ];
  return (
    <div className="hidden items-center md:flex" role="group" aria-label="View">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={view === o.id}
          className={cn(
            "flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-muted-foreground transition-all",
            view === o.id && "bg-card text-foreground shadow-sm",
          )}
        >
          <o.icon className="size-3.5" />
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Class for the primary action inside a toolbar (near-black, h-9, rounded-lg). */
export const PRIMARY_ACTION =
  "inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80 active:translate-y-px";

/* ── Folder tabs ─────────────────────────────────────────────────────────── */

/** Status colour order: all → waiting → done → refused → owed → extras. */
export const TAB_COLORS = {
  all: "#3b82f6",
  waiting: "#f59e0b",
  done: "#10b981",
  refused: "#ef4444",
  owed: "#f97316",
  pink: "#ec4899",
  violet: "#8b5cf6",
} as const;

export interface FolderTab<T extends string> {
  id: T;
  label: string;
  count: number;
  color: string;
}

/**
 * Category tabs shaped like folder dividers. Sits directly on top of a
 * `ListCard`; only the open tab is filled, with a coloured top edge.
 */
export function FolderTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: FolderTab<T>[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div role="tablist" className="-mb-4 flex items-end gap-1 overflow-x-auto [scrollbar-width:none]">
      {tabs.map((t) => {
        const active = t.id === value;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            style={{ "--tab": t.color } as CSSProperties}
            className={cn(
              "flex h-10 shrink-0 items-center gap-2 rounded-t-xl border-t-[3px] px-4 text-sm transition-colors",
              active
                ? "border-[var(--tab)] bg-card font-semibold text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
            <span
              className={cn(
                "rounded-md px-1.5 text-xs font-medium tabular-nums",
                active ? "text-foreground" : "bg-black/[0.06] dark:bg-white/10",
              )}
              style={
                active
                  ? { background: "color-mix(in oklch, var(--tab) 16%, transparent)" }
                  : undefined
              }
            >
              {t.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Table pieces ────────────────────────────────────────────────────────── */

/** The borderless white card a table (or folder-tabbed list) sits in. */
export function ListCard({
  children,
  className,
  tabbed = false,
}: {
  children: ReactNode;
  className?: string;
  /** Set when FolderTabs sit on top, so the first tab joins the card. */
  tabbed?: boolean;
}) {
  return (
    <div className={cn("overflow-hidden rounded-xl bg-card", tabbed && "rounded-tl-none", className)}>
      {children}
    </div>
  );
}

/** First-column cell: round initials avatar, name, muted second line. */
export function PersonCell({ name, sub }: { name: string; sub?: ReactNode }) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?";
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-vivid-cyan/10 text-[11px] font-semibold text-vivid-cyan">
        {initials}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium">{name}</span>
        {sub && <span className="block truncate text-xs text-muted-foreground">{sub}</span>}
      </span>
    </div>
  );
}

/** Table status: bordered pill with a small square colour swatch. */
export function StatusPill({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="inline-flex h-7 items-center gap-2 whitespace-nowrap rounded-lg border border-border/70 px-2.5 text-[13px]">
      <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: color }} />
      {children}
    </span>
  );
}

/** Card status: tiny square + italic name. */
export function CardStatus({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5 text-xs italic text-muted-foreground">
      <span className="size-2 rounded-[2px]" style={{ background: color }} />
      {children}
    </span>
  );
}

/** Red "Late" style mini-pill for owed or overdue amounts. */
export function MiniPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md bg-red-50 px-1.5 text-[11px] font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
      {children}
    </span>
  );
}

/* ── Record card (phone list item / cards view) ──────────────────────────── */

export function RecordCard({
  name,
  overline,
  status,
  details,
  amount,
  amountClassName,
  onClick,
  children,
}: {
  name: string;
  overline?: ReactNode;
  status?: ReactNode;
  details?: ReactNode;
  amount?: ReactNode;
  amountClassName?: string;
  onClick?: () => void;
  children?: ReactNode;
}) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?";
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl bg-card p-4 text-left transition-transform active:scale-[0.99] md:hover:shadow-md"
    >
      <span className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-vivid-cyan/10 text-xs font-semibold text-vivid-cyan">
          {initials}
        </span>
        <span className="min-w-0 flex-1">
          {overline && <span className="block truncate text-xs text-muted-foreground">{overline}</span>}
          <span className="block truncate text-[15px] font-semibold">{name}</span>
        </span>
        {status}
      </span>
      {children}
      <span className="mt-3 flex items-end justify-between gap-3 border-t border-dashed border-border/70 pt-3">
        <span className="min-w-0 truncate text-xs text-muted-foreground">{details}</span>
        {amount != null && (
          <span className={cn("shrink-0 text-lg font-semibold tabular-nums", amountClassName)}>{amount}</span>
        )}
      </span>
    </button>
  );
}

/* ── Empty states ────────────────────────────────────────────────────────── */

/**
 * `no-match`: a search or filter found nothing. `empty`: nothing here, and
 * that is good news. `first`: no records at all yet — offer the first action.
 */
export function CardsEmpty({
  kind,
  title,
  hint,
  icon,
  action,
}: {
  kind: "no-match" | "empty" | "first";
  title: string;
  hint?: string;
  /** Icon for `first`; the other kinds use their own. */
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-1 rounded-xl bg-card px-6 py-10 text-center">
      <span
        className={cn(
          "mb-2 flex size-14 items-center justify-center rounded-full [&_svg]:size-6",
          kind === "empty"
            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
            : "bg-muted text-muted-foreground",
        )}
      >
        {kind === "no-match" ? <SearchX /> : kind === "empty" ? <Check /> : icon}
      </span>
      <span className="text-[15px] font-semibold">{title}</span>
      {hint && <p className="max-w-xs text-sm text-muted-foreground">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ── Totals strip (torn ticket) ──────────────────────────────────────────── */

export function TotalsStrip({
  stub,
  items,
}: {
  stub: { label: string; value: string };
  items: { label: string; value: string; tone?: "in" | "owed" | "neutral" }[];
}) {
  return (
    <div className="flex justify-end">
      <div className="ticket-notch flex rounded-xl bg-card [--tear:9.5rem]">
        <div className="w-[9.5rem] shrink-0 px-5 py-3">
          <span className="block text-xs text-muted-foreground">{stub.label}</span>
          <span className="block text-lg font-semibold tabular-nums">{stub.value}</span>
        </div>
        <div className="flex gap-8 border-l border-dashed border-border px-5 py-3">
          {items.map((i) => (
            <span key={i.label}>
              <span className="block text-xs text-muted-foreground">{i.label}</span>
              <span
                className={cn(
                  "block text-lg font-semibold tabular-nums",
                  i.tone === "in" && "text-ocean-green",
                  i.tone === "owed" && "text-red-600 dark:text-red-400",
                )}
              >
                {i.value}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
