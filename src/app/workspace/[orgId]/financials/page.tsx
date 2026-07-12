import { Banknote, HandCoins, ReceiptText, TriangleAlert } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

export const metadata = { title: "Finance · CarHire" };

const kes = (n: number) => `KES ${Number(n).toLocaleString()}`;
const shortDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short" }) : "—";

interface FinContract {
  id: string;
  status: string;
  total_amount: number | null;
  amount_paid: number | null;
  refuel_penalty: number | null;
  contract_start: string | null;
  created_at: string;
  clients: { full_name: string } | null;
  cars: { reg_number: string } | null;
}

function Tile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Banknote;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex h-25 flex-col justify-between rounded-xl bg-muted/50 p-3">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Icon className="size-4" />
        {label}
      </div>
      <p className={`text-2xl font-semibold ${accent ?? ""}`}>{value}</p>
    </div>
  );
}

export default async function FinancialsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();

  const [contractsRes, debtRes] = await Promise.all([
    supabase
      .from("contracts")
      .select(
        "id, status, total_amount, amount_paid, refuel_penalty, contract_start, created_at, clients(full_name), cars(reg_number)"
      )
      .eq("org_id", orgId)
      .neq("status", "CANCELLED")
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("debt_owed").eq("org_id", orgId).gt("debt_owed", 0),
  ]);

  const contracts = (contractsRes.data ?? []) as unknown as FinContract[];

  const collected = contracts.reduce((s, c) => s + Number(c.amount_paid ?? 0), 0);
  const outstanding = contracts.reduce(
    (s, c) =>
      s + Math.max(0, Number(c.total_amount ?? 0) + Number(c.refuel_penalty ?? 0) - Number(c.amount_paid ?? 0)),
    0
  );
  const clientDebt = (debtRes.data ?? []).reduce((s, c) => s + Number(c.debt_owed ?? 0), 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthRevenue = contracts
    .filter((c) => new Date(c.contract_start ?? c.created_at) >= monthStart)
    .reduce((s, c) => s + Number(c.amount_paid ?? 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-xl">Finance</h1>
        <p className="text-sm text-muted-foreground">
          Collections, balances and per-rental money — payments are staff-entered
          for MVP.
        </p>
      </div>

      {/* Summary tiles */}
      <div className="grid auto-rows-min gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Tile icon={Banknote} label="Collected (all time)" value={kes(collected)} />
        <Tile icon={HandCoins} label="Revenue this month" value={kes(monthRevenue)} />
        <Tile
          icon={ReceiptText}
          label="Outstanding balances"
          value={kes(outstanding)}
          accent={outstanding > 0 ? "text-amber-600 dark:text-amber-400" : undefined}
        />
        <Tile
          icon={TriangleAlert}
          label="Client debt on file"
          value={kes(clientDebt)}
          accent={clientDebt > 0 ? "text-red-600 dark:text-red-400" : undefined}
        />
      </div>

      {/* Ledger */}
      {contracts.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
          No rentals yet — money shows up here once contracts exist.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead className="hidden sm:table-cell">Start</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="hidden sm:table-cell">Penalty</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((c) => {
                const balance =
                  Number(c.total_amount ?? 0) +
                  Number(c.refuel_penalty ?? 0) -
                  Number(c.amount_paid ?? 0);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.clients?.full_name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.cars?.reg_number ?? "—"}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
                      {shortDate(c.contract_start ?? c.created_at)}
                    </TableCell>
                    <TableCell className="tabular-nums">{kes(c.total_amount ?? 0)}</TableCell>
                    <TableCell className="hidden tabular-nums text-muted-foreground sm:table-cell">
                      {c.refuel_penalty ? kes(c.refuel_penalty) : "—"}
                    </TableCell>
                    <TableCell className="tabular-nums">{kes(c.amount_paid ?? 0)}</TableCell>
                    <TableCell className="tabular-nums">
                      {balance > 0 ? (
                        <span className="font-medium text-red-500">{kes(balance)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{c.status}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
