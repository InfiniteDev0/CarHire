import { createClient } from "@/lib/supabase/server";
import { ClientsView } from "@/features/clients/components/clients-view";
import { CLIENT_COLUMNS, type ClientRow } from "@/features/clients/types";

export const metadata = { title: "Clients · CarHire" };

export default async function ClientsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();

  const [{ data: clients }, { data: members }] = await Promise.all([
    supabase
      .from("clients")
      .select(CLIENT_COLUMNS)
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),
    supabase.from("org_members").select("user_id, full_name").eq("org_id", orgId),
  ]);

  const rows = (clients ?? []) as unknown as ClientRow[];
  // user_id → staff name, for "registered by" in the details sheet.
  const staffNames = Object.fromEntries(
    (members ?? []).map((m) => [m.user_id as string, (m.full_name as string) ?? "Staff"])
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-xl">Clients</h1>
        <p className="text-sm text-muted-foreground">
          {rows.length} {rows.length === 1 ? "hirer" : "hirers"} — KYC, debts and
          rental history.
        </p>
      </div>

      <ClientsView orgId={orgId} clients={rows} staffNames={staffNames} />
    </div>
  );
}
