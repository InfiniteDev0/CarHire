import { createClient } from "@/lib/supabase/server";
import { getMembership } from "@/lib/auth/membership";
import { HomeGreeting } from "@/components/workspace/home/home-greeting";
import { FleetStats, type FleetCounts } from "@/components/workspace/home/fleet-stats";
import { MoneyStats, type MoneyStatsData } from "@/components/workspace/home/money-stats";
import { OngoingRentals } from "@/components/workspace/home/ongoing-rentals";
import { RecentActivity, type ActivityEvent } from "@/components/workspace/home/recent-activity";
import { RevenueChart, type MonthMoney } from "@/components/workspace/home/revenue-chart";
import { FleetRadial } from "@/components/workspace/home/fleet-radial";
import { displayStatus, type ContractRow } from "@/features/rentals/helpers";
import type { Rental, RentalStatus } from "@/lib/constants/rentals";

export const metadata = { title: "Home · CarHire" };

const DAY = 86400_000;

type ActiveContract = ContractRow & { county: string | null };

// Module-level (not render) so the impure Date.now() stays out of the component.
function toHomeRentals(active: ActiveContract[]): Rental[] {
  const now = Date.now();
  return active.map((c) => {
    const display = displayStatus(c);
    const due = c.contract_expiration ? new Date(c.contract_expiration).getTime() : null;
    let status: RentalStatus = "ACTIVE";
    if (display === "OVERDUE") status = "OVERDUE";
    else if (due != null && due - now <= DAY) status = "DUE_SOON";
    return {
      id: c.id,
      regNumber: c.cars?.reg_number ?? "—",
      make: c.cars?.make ?? "",
      model: c.cars?.model ?? "",
      clientName: c.clients?.full_name ?? "—",
      clientPhone: c.clients?.phone ?? "",
      county: c.county ?? "—",
      ratePerDay: Number(c.rate_per_day),
      startDate: c.contract_start ?? c.created_at,
      dueDate: c.contract_expiration ?? c.created_at,
      status,
    };
  });
}

/**
 * Workspace home — real numbers. Renders inside the shell from layout.tsx,
 * which already guarded membership.
 */
export default async function WorkspaceHome({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();

  const [{ data: { user } }, { membership }] = await Promise.all([
    supabase.auth.getUser(),
    getMembership(orgId),
  ]);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const logColumns = "id, created_at, contracts(clients(full_name), cars(reg_number))";

  const [carsRes, contractsRes, moneyRes, debtRes, expensesRes, checkoutsRes, checkinsRes] =
    await Promise.all([
      supabase
        .from("cars")
        .select("status")
        .eq("org_id", orgId)
        .is("decommissioned_at", null),
      supabase
        .from("contracts")
        .select(
          "id, status, rate_per_day, duration_days, contract_start, contract_expiration, created_at, clients(full_name, phone, is_blocked), cars(reg_number, make, model), county:domicile"
        )
        .eq("org_id", orgId)
        .eq("status", "ACTIVE")
        .order("contract_expiration", { ascending: true })
        .limit(10),
      supabase
        .from("contracts")
        .select("total_amount, amount_paid, refuel_penalty, contract_start, created_at")
        .eq("org_id", orgId)
        .neq("status", "CANCELLED"),
      supabase.from("clients").select("debt_owed").eq("org_id", orgId).gt("debt_owed", 0),
      supabase
        .from("expenses")
        .select("amount, incurred_on")
        .eq("org_id", orgId)
        .gte(
          "incurred_on",
          new Date(monthStart.getFullYear(), monthStart.getMonth() - 5, 1)
            .toISOString()
            .slice(0, 10)
        ),
      supabase
        .from("checkout_logs")
        .select(logColumns)
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("checkin_logs")
        .select(logColumns)
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  // Fleet counts by status
  const statuses = (carsRes.data ?? []).map((c) => c.status as string);
  const counts: FleetCounts = {
    total: statuses.length,
    available: statuses.filter((s) => s === "AVAILABLE").length,
    onTrip: statuses.filter((s) => s === "TRIP").length,
    maintenance: statuses.filter((s) => s === "MAINTENANCE").length,
  };

  // Map active contracts → the home table's display rows
  const active = (contractsRes.data ?? []) as unknown as ActiveContract[];
  const rentals = toHomeRentals(active);

  // Money row — same math as the Finance page, condensed
  const money = moneyRes.data ?? [];
  const monthRevenue = money
    .filter((c) => new Date(c.contract_start ?? c.created_at) >= monthStart)
    .reduce((s, c) => s + Number(c.amount_paid ?? 0), 0);
  const outstanding = money.reduce(
    (s, c) =>
      s +
      Math.max(
        0,
        Number(c.total_amount ?? 0) + Number(c.refuel_penalty ?? 0) - Number(c.amount_paid ?? 0)
      ),
    0
  );
  const clientDebt = (debtRes.data ?? []).reduce((s, c) => s + Number(c.debt_owed ?? 0), 0);
  const activeFleet = counts.total - counts.maintenance;
  const moneyData: MoneyStatsData = {
    monthRevenue,
    outstanding,
    clientDebt,
    utilization: activeFleet > 0 ? Math.round((counts.onTrip / activeFleet) * 100) : 0,
  };

  // Monthly revenue vs expenses for the chart (last 6 months)
  const monthKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`;
  const months: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(monthStart.getFullYear(), monthStart.getMonth() - i, 1);
    months.push({
      key: monthKey(d),
      label: d.toLocaleDateString("en-KE", { month: "short" }),
    });
  }
  const revenueByMonth = new Map<string, number>();
  for (const c of money) {
    const k = monthKey(new Date(c.contract_start ?? c.created_at));
    revenueByMonth.set(k, (revenueByMonth.get(k) ?? 0) + Number(c.amount_paid ?? 0));
  }
  const expensesByMonth = new Map<string, number>();
  for (const e of expensesRes.data ?? []) {
    const k = monthKey(new Date(e.incurred_on));
    expensesByMonth.set(k, (expensesByMonth.get(k) ?? 0) + Number(e.amount));
  }
  const chartData: MonthMoney[] = months.map((m) => ({
    month: m.label,
    revenue: revenueByMonth.get(m.key) ?? 0,
    expenses: expensesByMonth.get(m.key) ?? 0,
  }));

  // Merge checkout + checkin logs into one feed, newest first
  interface LogRow {
    id: string;
    created_at: string;
    contracts: { clients: { full_name: string } | null; cars: { reg_number: string } | null } | null;
  }
  const toEvents = (rows: unknown, kind: ActivityEvent["kind"]): ActivityEvent[] =>
    ((rows ?? []) as LogRow[]).map((l) => ({
      id: l.id,
      kind,
      at: l.created_at,
      regNumber: l.contracts?.cars?.reg_number ?? "—",
      clientName: l.contracts?.clients?.full_name ?? "—",
    }));
  const events = [
    ...toEvents(checkoutsRes.data, "CHECKOUT"),
    ...toEvents(checkinsRes.data, "CHECKIN"),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 8);

  const name =
    (user?.user_metadata?.full_name as string)?.split(" ")[0] || "there";
  const role = membership?.role === "admin" ? "workspace admin" : "staff member";

  return (
    <div className="flex flex-col gap-3">
      <HomeGreeting orgId={orgId} name={name} role={role} />
      <FleetStats orgId={orgId} counts={counts} />
      <MoneyStats orgId={orgId} data={moneyData} />
      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <RevenueChart data={chartData} />
        <FleetRadial
          utilization={moneyData.utilization}
          onTrip={counts.onTrip}
          total={activeFleet}
        />
      </div>
      <div className="grid gap-3 lg:grid-cols-1">
        <OngoingRentals orgId={orgId} rentals={rentals} />
        <RecentActivity events={events} />
      </div>
    </div>
  );
}

// grid-cols-[2fr_1fr]