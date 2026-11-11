import { createClient } from "@/lib/supabase/server";
import { getStaffNames } from "@/lib/staff-names";
import { RentalsView } from "@/features/rentals/components/rentals-view";
import { CONTRACT_COLUMNS, type ContractRow } from "@/features/rentals/helpers";
import type { PickClient, PickCar, OrgRules } from "@/features/rentals/components/new-rental-wizard";

export const metadata = { title: "Rentals · Socdal" };

export default async function RentalsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { orgId } = await params;
  const { new: newParam } = await searchParams;
  const supabase = await createClient();

  const [contractsRes, clientsRes, carsRes, orgRes, staffNames] = await Promise.all([
    supabase
      .from("contracts")
      .select(CONTRACT_COLUMNS)
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),
    supabase
      .from("clients")
      .select("id, full_name, phone, national_id, is_blocked, debt_owed")
      .eq("org_id", orgId)
      .order("full_name"),
    supabase
      .from("cars")
      .select("id, reg_number, make, model, rate_per_day, deposit")
      .eq("org_id", orgId)
      .eq("status", "AVAILABLE")
      .is("decommissioned_at", null)
      .order("reg_number"),
    supabase
      .from("organizations")
      .select(
        "curfew_start, curfew_end, rate_floor, rate_ceiling, refuel_penalty_per_level, allow_multiple_rentals, max_concurrent_rentals"
      )
      .eq("id", orgId)
      .maybeSingle(),
    getStaffNames(supabase, orgId),
  ]);

  const contracts = (contractsRes.data ?? []) as unknown as ContractRow[];
  const clients = (clientsRes.data ?? []) as PickClient[];
  const cars = (carsRes.data ?? []) as PickCar[];
  const rules: OrgRules = {
    curfew_start: orgRes.data?.curfew_start ?? null,
    curfew_end: orgRes.data?.curfew_end ?? null,
    rate_floor: orgRes.data?.rate_floor ?? null,
    rate_ceiling: orgRes.data?.rate_ceiling ?? null,
    refuel_penalty_per_level: orgRes.data?.refuel_penalty_per_level ?? null,
    allow_multiple_rentals: orgRes.data?.allow_multiple_rentals ?? false,
    max_concurrent_rentals: orgRes.data?.max_concurrent_rentals ?? 1,
  };

  // How many open (DRAFT/ACTIVE) rentals each client already holds — powers the
  // wizard's concurrent-rental message and the additional-driver requirement.
  const openRentalsByClient: Record<string, number> = {};
  for (const c of contracts) {
    if (c.status === "DRAFT" || c.status === "ACTIVE") {
      openRentalsByClient[c.client_id] = (openRentalsByClient[c.client_id] ?? 0) + 1;
    }
  }

  // ?new=1 opens the wizard; ?new=<carId> opens it with that car preselected.
  const openNew = !!newParam;
  const initialCarId = newParam && newParam !== "1" ? newParam : null;

  return (
    <div className="flex flex-col gap-4">
      <RentalsView
        orgId={orgId}
        contracts={contracts}
        clients={clients}
        cars={cars}
        rules={rules}
        openRentalsByClient={openRentalsByClient}
        openNewOnLoad={openNew}
        initialCarId={initialCarId}
        staffNames={staffNames}
      />
    </div>
  );
}
