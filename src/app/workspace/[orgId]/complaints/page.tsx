import { createClient } from "@/lib/supabase/server";
import {
  ComplaintsView,
  type ComplaintRow,
  type ComplaintContractPick,
  type ComplaintCarPick,
} from "@/features/complaints/components/complaints-view";

export const metadata = { title: "Complaints · CarHire" };

export default async function ComplaintsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();

  const [complaintsRes, contractsRes, carsRes] = await Promise.all([
    supabase
      .from("complaints")
      .select(
        "id, type, description, is_resolved, created_at, resolved_at, cars(reg_number, make, model), contracts(id, clients(full_name))"
      )
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),
    supabase
      .from("contracts")
      .select("id, status, clients(full_name), cars(reg_number)")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("cars")
      .select("id, reg_number, make, model")
      .eq("org_id", orgId)
      .is("decommissioned_at", null)
      .order("reg_number"),
  ]);

  const complaints = (complaintsRes.data ?? []) as unknown as ComplaintRow[];

  interface ContractPickRow {
    id: string;
    status: string;
    cars: { reg_number: string } | null;
    clients: { full_name: string } | null;
  }
  const contractPicks: ComplaintContractPick[] = (
    (contractsRes.data ?? []) as unknown as ContractPickRow[]
  ).map((c) => ({
    id: c.id,
    label: `${c.cars?.reg_number ?? "—"} · ${c.clients?.full_name ?? "—"} · ${c.status}`,
  }));

  const carPicks: ComplaintCarPick[] = (carsRes.data ?? []).map((c) => ({
    id: c.id as string,
    label: `${c.reg_number} · ${[c.make, c.model].filter(Boolean).join(" ")}`,
  }));

  const openCount = complaints.filter((c) => !c.is_resolved).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-xl">Complaints</h1>
        <p className="text-sm text-muted-foreground">
          Incident log — {openCount} open of {complaints.length} filed.
        </p>
      </div>

      <ComplaintsView
        orgId={orgId}
        complaints={complaints}
        contractPicks={contractPicks}
        carPicks={carPicks}
      />
    </div>
  );
}
