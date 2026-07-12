import { createClient } from "@/lib/supabase/server";
import { getMembership } from "@/lib/auth/membership";
import { HomeGreeting } from "@/components/workspace/home/home-greeting";
import { FleetStats, type FleetCounts } from "@/components/workspace/home/fleet-stats";
import { OngoingRentals } from "@/components/workspace/home/ongoing-rentals";
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

  const [carsRes, contractsRes] = await Promise.all([
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

  const name =
    (user?.user_metadata?.full_name as string)?.split(" ")[0] || "there";
  const role = membership?.role === "admin" ? "workspace admin" : "staff member";

  return (
    <div className="flex flex-col gap-3">
      <HomeGreeting orgId={orgId} name={name} role={role} />
      <FleetStats orgId={orgId} counts={counts} />
      <OngoingRentals orgId={orgId} rentals={rentals} />
    </div>
  );
}
