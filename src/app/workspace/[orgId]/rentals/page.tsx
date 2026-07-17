import { createClient } from "@/lib/supabase/server";
import { RentalsView } from "@/features/rentals/components/rentals-view";
import { CONTRACT_COLUMNS, type ContractRow } from "@/features/rentals/helpers";
import type { PickClient, PickCar, OrgRules } from "@/features/rentals/components/new-rental-wizard";

export const metadata = { title: "Rentals · CarHire" };

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

  const [contractsRes, clientsRes, carsRes, orgRes] = await Promise.all([
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
      .select("curfew_start, curfew_end, rate_floor, rate_ceiling")
      .eq("id", orgId)
      .maybeSingle(),
  ]);

  const contracts = (contractsRes.data ?? []) as unknown as ContractRow[];
  const clients = (clientsRes.data ?? []) as PickClient[];
  const cars = (carsRes.data ?? []) as PickCar[];
  const rules: OrgRules = {
    curfew_start: orgRes.data?.curfew_start ?? null,
    curfew_end: orgRes.data?.curfew_end ?? null,
    rate_floor: orgRes.data?.rate_floor ?? null,
    rate_ceiling: orgRes.data?.rate_ceiling ?? null,
  };

  // ?new=1 opens the wizard; ?new=<carId> opens it with that car preselected.
  const openNew = !!newParam;
  const initialCarId = newParam && newParam !== "1" ? newParam : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-xl">Rentals</h1>
        <p className="text-sm text-muted-foreground">
          Agreements, checkouts and returns — {contracts.length} total.
        </p>
      </div>

      <RentalsView
        orgId={orgId}
        contracts={contracts}
        clients={clients}
        cars={cars}
        rules={rules}
        openNewOnLoad={openNew}
        initialCarId={initialCarId}
      />
    </div>
  );
}
