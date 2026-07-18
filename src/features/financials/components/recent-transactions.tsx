"use client";

import { useMemo, useState } from "react";
import { Search, Download, Banknote } from "lucide-react";

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

export interface TransactionRow {
  id: string;
  amount: number;
  kind: "DEPOSIT" | "PAYMENT" | "EXTENSION";
  method: "CASH" | "MPESA" | "CARD" | "BANK" | "OTHER";
  reference: string | null;
  created_at: string;
  recorded_by: string | null;
  contracts: {
    clients: { full_name: string } | null;
    cars: { reg_number: string } | null;
  } | null;
}

const kes = (n: number) => `KES ${Number(n).toLocaleString()}`;
const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

const TABS = ["ALL", "DEPOSIT", "PAYMENT", "EXTENSION"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  ALL: "View all",
  DEPOSIT: "Deposits",
  PAYMENT: "Payments",
  EXTENSION: "Extensions",
};

const KIND_BADGE: Record<TransactionRow["kind"], string> = {
  DEPOSIT: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  PAYMENT: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  EXTENSION: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
};

const METHOD_LABELS: Record<TransactionRow["method"], string> = {
  CASH: "Cash",
  MPESA: "M-Pesa",
  CARD: "Card",
  BANK: "Bank",
  OTHER: "Other",
};

export function RecentTransactions({
  transactions,
  staffNames,
}: {
  transactions: TransactionRow[];
  staffNames?: Record<string, string>;
}) {
  const [tab, setTab] = useState<Tab>("ALL");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      if (tab !== "ALL" && t.kind !== tab) return false;
      if (!q) return true;
      return [t.contracts?.clients?.full_name, t.contracts?.cars?.reg_number]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [transactions, tab, search]);

  function exportCsv() {
    const header = "Date,Client,Vehicle,Type,Method,Amount (KES)";
    const lines = filtered.map((t) =>
      [
        new Date(t.created_at).toLocaleString("en-KE"),
        `"${t.contracts?.clients?.full_name ?? ""}"`,
        t.contracts?.cars?.reg_number ?? "",
        t.kind,
        METHOD_LABELS[t.method],
        Number(t.amount),
      ].join(",")
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-medium">Recent transactions</h2>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative w-full max-w-56">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search client or vehicle…"
              className="h-8 pl-8"
            />
          </div>
          {filtered.length > 0 && (
            <Button variant="outline" className="size-8 p-0" onClick={exportCsv}>
              <Download className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Kind tabs */}
      <div className="flex gap-4 border-b">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "relative pb-2 text-sm transition-colors",
              tab === t
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {TAB_LABELS[t]}
            {tab === t && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-foreground" />
            )}
          </button>
        ))}
      </div>

      {/* Rows */}
      {filtered.length === 0 ? (
        <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center">
          <Banknote className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {transactions.length === 0
              ? "No money recorded yet — deposits and payments land here."
              : "Nothing matches this filter."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="hidden sm:table-cell">Vehicle</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden sm:table-cell">Method</TableHead>
                <TableHead className="hidden md:table-cell">Recorded by</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {fmt(t.created_at)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {t.contracts?.clients?.full_name ?? "—"}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    {t.contracts?.cars?.reg_number ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className={KIND_BADGE[t.kind]}>
                      {t.kind.charAt(0) + t.kind.slice(1).toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-muted-foreground">{METHOD_LABELS[t.method]}</span>
                    {t.reference && (
                      <p
                        className="max-w-40 truncate text-xs text-muted-foreground/70"
                        title={t.reference}
                      >
                        {t.reference}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {(t.recorded_by && staffNames?.[t.recorded_by]) || "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {kes(t.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
