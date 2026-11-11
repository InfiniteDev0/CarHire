"use client";

import { useMemo, useState } from "react";
import { FileText, Plus } from "lucide-react";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  ActionTray,
  CardStatus,
  CardsEmpty,
  FolderTabs,
  ListCard,
  ListToolbar,
  MiniPill,
  PageHeading,
  PersonCell,
  PRIMARY_ACTION,
  RecordCard,
  StatusPill,
  TableSearch,
  TotalsStrip,
  TrayDivider,
  ViewSwitch,
  type ListView,
} from "@/components/workspace/list";
import {
  ExportAction,
  RowCheck,
  SelectionBar,
  SortMenu,
  exportCsv,
  useSelection,
} from "@/components/workspace/list/tools";
import { cn } from "@/lib/utils";
import { getContractLogs } from "../actions";
import {
  displayStatus,
  contractBalance,
  type ContractRow,
  type CheckoutLog,
  type CheckinLog,
} from "../helpers";
import { NewRentalWizard, type PickClient, type PickCar, type OrgRules } from "./new-rental-wizard";
import { ContractDetailsSheet } from "./contract-details-sheet";
import { money } from "@/lib/money";

const shortDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short" }) : "—";

const FILTERS = ["ALL", "DRAFT", "ACTIVE", "EXTENDED", "OVERDUE", "COMPLETED", "CANCELLED"] as const;
type Filter = (typeof FILTERS)[number];

type Sort = "NEW" | "RETURN" | "BALANCE";
const SORTS: { value: Sort; label: string }[] = [
  { value: "NEW", label: "Newest first" },
  { value: "RETURN", label: "Return date (soonest)" },
  { value: "BALANCE", label: "Balance (highest)" },
];

// Folder-tab order and colours: all → waiting → running → late → done → refused.
const STATUS: Record<Filter, { label: string; color: string }> = {
  ALL: { label: "All", color: "#3b82f6" },
  DRAFT: { label: "Draft", color: "#f59e0b" },
  ACTIVE: { label: "Active", color: "#10b981" },
  EXTENDED: { label: "Extended", color: "#8b5cf6" },
  OVERDUE: { label: "Overdue", color: "#ef4444" },
  COMPLETED: { label: "Completed", color: "#14b8a6" },
  CANCELLED: { label: "Cancelled", color: "#a1a1aa" },
};

export function RentalsView({
  orgId,
  contracts,
  clients,
  cars,
  rules,
  openRentalsByClient,
  openNewOnLoad,
  initialCarId,
  staffNames,
}: {
  orgId: string;
  contracts: ContractRow[];
  clients: PickClient[];
  cars: PickCar[];
  rules: OrgRules;
  openRentalsByClient: Record<string, number>;
  openNewOnLoad: boolean;
  initialCarId: string | null;
  staffNames?: Record<string, string>;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [view, setView] = useState<ListView>("table");
  const [sort, setSort] = useState<Sort>("NEW");
  const [wizardOpen, setWizardOpen] = useState(openNewOnLoad);
  const [detailsTarget, setDetailsTarget] = useState<ContractRow | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [logs, setLogs] = useState<{ checkout: CheckoutLog | null; checkin: CheckinLog | null } | null>(null);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = {
      ALL: contracts.length,
      DRAFT: 0,
      ACTIVE: 0,
      EXTENDED: 0,
      OVERDUE: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    for (const row of contracts) c[displayStatus(row) as Filter]++;
    return c;
  }, [contracts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = contracts.filter((c) => {
      if (filter !== "ALL" && displayStatus(c) !== filter) return false;
      if (!q) return true;
      return [
        c.clients?.full_name,
        c.clients?.phone,
        c.cars?.reg_number,
        c.cars?.make,
        c.cars?.model,
      ]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
    if (sort === "RETURN") {
      const end = (c: ContractRow) =>
        c.contract_expiration ? new Date(c.contract_expiration).getTime() : Number.MAX_SAFE_INTEGER;
      return [...rows].sort((a, b) => end(a) - end(b));
    }
    if (sort === "BALANCE") return [...rows].sort((a, b) => contractBalance(b) - contractBalance(a));
    return rows;
  }, [contracts, search, filter, sort]);

  const selection = useSelection(filtered.map((c) => c.id));

  function exportSelected() {
    const rows = filtered.filter((c) => selection.has(c.id));
    exportCsv(
      "rentals.csv",
      ["Client", "Phone", "Vehicle", "Registration", "Start", "End", "Total (USD)", "Paid (USD)", "Balance (USD)", "Status"],
      rows.map((c) => [
        c.clients?.full_name,
        c.clients?.phone,
        [c.cars?.make, c.cars?.model].filter(Boolean).join(" "),
        c.cars?.reg_number,
        (c.contract_start ?? c.created_at ?? "").slice(0, 10),
        (c.contract_expiration ?? "").slice(0, 10),
        Number(c.total_amount ?? 0),
        Number(c.amount_paid ?? 0),
        Math.max(0, contractBalance(c)),
        STATUS[displayStatus(c) as Filter].label,
      ]),
    );
  }

  // Totals for the rows showing (cancelled agreements are not money owed).
  const totals = useMemo(() => {
    let billed = 0;
    let collected = 0;
    let owed = 0;
    for (const c of filtered) {
      if (c.status === "CANCELLED") continue;
      billed += Number(c.total_amount ?? 0);
      collected += Number(c.amount_paid ?? 0);
      owed += Math.max(0, contractBalance(c));
    }
    return { billed, collected, owed };
  }, [filtered]);

  function openDetails(c: ContractRow) {
    setDetailsTarget(c);
    setLogs(null);
    setDetailsOpen(true);
    getContractLogs(orgId, c.id)
      .then(setLogs)
      .catch(() => setLogs({ checkout: null, checkin: null }));
  }

  const carLabel = (c: ContractRow) =>
    [c.cars?.make, c.cars?.model].filter(Boolean).join(" ") || "Vehicle";

  const tabs = FILTERS.filter((f) => f === "ALL" || counts[f] > 0 || f === filter).map((f) => ({
    id: f,
    label: STATUS[f].label,
    count: counts[f],
    color: STATUS[f].color,
  }));

  const cards = (
    <div className="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-5 xl:grid-cols-3">
      {filtered.map((c) => {
        const status = displayStatus(c) as Filter;
        const balance = contractBalance(c);
        return (
          <RecordCard
            key={c.id}
            name={c.clients?.full_name ?? "Client"}
            overline={`${carLabel(c)} · ${c.cars?.reg_number ?? "—"}`}
            status={<CardStatus color={STATUS[status].color}>{STATUS[status].label}</CardStatus>}
            details={`${shortDate(c.contract_start ?? c.created_at)} → ${shortDate(c.contract_expiration)}${
              balance > 0 ? ` · owes ${money(balance)}` : ""
            }`}
            amount={money(c.total_amount ?? 0)}
            onClick={() => openDetails(c)}
          />
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeading
        title="Rentals"
        description="Every rental agreement, from draft to return: who has which car, until when, and what is still owed."
        count={filtered.length}
        noun="rental"
      />

      <ListToolbar>
        <TableSearch value={search} onChange={setSearch} placeholder="Search client or vehicle" />
        <SortMenu<Sort> options={SORTS} value={sort} onChange={setSort} defaultValue="NEW" />
        <ActionTray>
          <ViewSwitch view={view} onChange={setView} />
          <span className="hidden md:block">
            <TrayDivider />
          </span>
          <button type="button" className={PRIMARY_ACTION} onClick={() => setWizardOpen(true)}>
            <Plus className="size-4" />
            New rental
          </button>
        </ActionTray>
      </ListToolbar>

      {contracts.length === 0 ? (
        <CardsEmpty
          kind="first"
          icon={<FileText />}
          title="No rentals yet"
          hint="Create your first rental agreement to see it here."
          action={
            <button
              type="button"
              className={cn(PRIMARY_ACTION, "h-11 rounded-md px-6 text-[15px]")}
              onClick={() => setWizardOpen(true)}
            >
              Start a rental
            </button>
          }
        />
      ) : (
        <>
          <SelectionBar count={selection.count} onClear={selection.clear}>
            <ExportAction onClick={exportSelected} />
          </SelectionBar>

          <FolderTabs<Filter> tabs={tabs} value={filter} onChange={setFilter} />

          {filtered.length === 0 ? (
            filter === "OVERDUE" && !search ? (
              <CardsEmpty kind="empty" title="No rental is overdue" hint="Anything late shows up here." />
            ) : (
              <CardsEmpty
                kind="no-match"
                title="No rentals match"
                hint="Try another word, or pick a different tab."
              />
            )
          ) : (
            <>
              {/* Phones always get cards; desktop follows the view switch. */}
              <div className={cn("pt-4", view === "table" && "md:hidden")}>{cards}</div>
              {view === "table" && (
                <ListCard tabbed={filter === tabs[0].id} className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <RowCheck checked={selection.allSelected} onChange={selection.toggleAll} label="Select all" />
                        </TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((c) => {
                        const status = displayStatus(c) as Filter;
                        const balance = contractBalance(c);
                        return (
                          <TableRow
                            key={c.id}
                            className="cursor-pointer"
                            data-state={selection.has(c.id) ? "selected" : undefined}
                            onClick={() => openDetails(c)}
                          >
                            <TableCell className="w-10">
                              <RowCheck
                                checked={selection.has(c.id)}
                                onChange={() => selection.toggle(c.id)}
                                label={`Select ${c.clients?.full_name ?? "rental"}`}
                              />
                            </TableCell>
                            <TableCell>
                              <PersonCell
                                name={c.clients?.full_name ?? "—"}
                                sub={c.clients?.phone ?? undefined}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{c.cars?.reg_number ?? "—"}</div>
                              <div className="text-xs text-muted-foreground">{carLabel(c)}</div>
                            </TableCell>
                            <TableCell className="tabular-nums text-muted-foreground">
                              {shortDate(c.contract_start ?? c.created_at)} → {shortDate(c.contract_expiration)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {money(c.total_amount ?? 0)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {balance > 0 ? (
                                <span className="inline-flex items-center gap-2 font-medium text-red-600 dark:text-red-400">
                                  {status === "OVERDUE" && <MiniPill>Late</MiniPill>}
                                  {money(balance)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <StatusPill color={STATUS[status].color}>{STATUS[status].label}</StatusPill>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ListCard>
              )}

              <TotalsStrip
                stub={{ label: "Total billed", value: money(totals.billed) }}
                items={[
                  { label: "Collected", value: money(totals.collected), tone: "in" },
                  { label: "Owed", value: money(totals.owed), tone: totals.owed > 0 ? "owed" : "neutral" },
                ]}
              />
            </>
          )}
        </>
      )}

      {/* Sheets */}
      <NewRentalWizard
        orgId={orgId}
        clients={clients}
        cars={cars}
        rules={rules}
        openRentalsByClient={openRentalsByClient}
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        initialCarId={initialCarId}
      />
      <ContractDetailsSheet
        orgId={orgId}
        contract={detailsTarget}
        logs={logs}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        staffNames={staffNames}
        penaltyPerStep={Number(rules.refuel_penalty_per_level ?? 1500)}
      />
    </div>
  );
}
