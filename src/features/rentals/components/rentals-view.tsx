"use client";

import { useMemo, useState } from "react";
import { Search, FileText, Plus, ChevronRight } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
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
import { ContractDetailsSheet, STATUS_BADGE } from "./contract-details-sheet";

const kes = (n: number) => `KES ${Number(n).toLocaleString()}`;
const shortDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short" }) : "—";

const FILTERS = ["ALL", "DRAFT", "ACTIVE", "EXTENDED", "OVERDUE", "COMPLETED", "CANCELLED"] as const;
type Filter = (typeof FILTERS)[number];

export function RentalsView({
  orgId,
  contracts,
  clients,
  cars,
  rules,
  openNewOnLoad,
  initialCarId,
}: {
  orgId: string;
  contracts: ContractRow[];
  clients: PickClient[];
  cars: PickCar[];
  rules: OrgRules;
  openNewOnLoad: boolean;
  initialCarId: string | null;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");
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
    return contracts.filter((c) => {
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
  }, [contracts, search, filter]);

  function openDetails(c: ContractRow) {
    setDetailsTarget(c);
    setLogs(null);
    setDetailsOpen(true);
    getContractLogs(orgId, c.id)
      .then(setLogs)
      .catch(() => setLogs({ checkout: null, checkin: null }));
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search client or vehicle…"
            className="h-8 pl-8"
          />
        </div>
        <div className="ml-auto">
          <Button className="h-8 gap-1.5 rounded-sm" onClick={() => setWizardOpen(true)}>
            <Plus className="size-4" />
            New rental
          </Button>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              filter === f
                ? "border-foreground bg-foreground text-background"
                : "border-input text-muted-foreground hover:text-foreground"
            )}
          >
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            <span className="ml-1 opacity-60">{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex min-h-60 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center">
          <FileText className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {contracts.length === 0
              ? "No rentals yet. Create your first agreement."
              : "No rentals match this filter."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead className="hidden md:table-cell">Period</TableHead>
                <TableHead className="hidden sm:table-cell">Total</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const status = displayStatus(c);
                const balance = contractBalance(c);
                return (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => openDetails(c)}>
                    <TableCell>
                      <div className="font-medium">{c.clients?.full_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{c.clients?.phone ?? ""}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{c.cars?.reg_number ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {[c.cars?.make, c.cars?.model].filter(Boolean).join(" ")}
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground tabular-nums md:table-cell">
                      {shortDate(c.contract_start ?? c.created_at)} → {shortDate(c.contract_expiration)}
                    </TableCell>
                    <TableCell className="hidden tabular-nums sm:table-cell">
                      {kes(c.total_amount ?? 0)}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {balance > 0 ? (
                        <span className="font-medium text-red-500">{kes(balance)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_BADGE[status]}>{status}</Badge>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Sheets */}
      <NewRentalWizard
        orgId={orgId}
        clients={clients}
        cars={cars}
        rules={rules}
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
      />
    </div>
  );
}
