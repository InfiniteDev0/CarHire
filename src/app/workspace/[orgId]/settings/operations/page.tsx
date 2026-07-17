import { requireAdmin } from "@/lib/auth/membership";
import { createClient } from "@/lib/supabase/server";
import {
  OrgOperationsForm,
  type OrgOperations,
} from "@/features/settings/components/org-operations-form";

export const metadata = { title: "Operations · Settings · CarHire" };

export default async function OperationsSettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  await requireAdmin(orgId);

  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("curfew_start, curfew_end, rate_floor, rate_ceiling")
    .eq("id", orgId)
    .maybeSingle();

  // time columns come back as "HH:MM:SS" — trim for the time inputs.
  const t = (v: string | null) => (v ? v.slice(0, 5) : "");
  const initial: OrgOperations = {
    curfewStart: t(org?.curfew_start ?? null),
    curfewEnd: t(org?.curfew_end ?? null),
    rateFloor: org?.rate_floor != null ? String(org.rate_floor) : "",
    rateCeiling: org?.rate_ceiling != null ? String(org.rate_ceiling) : "",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h2 className="text-sm font-medium">Operations</h2>
        <p className="text-xs text-muted-foreground">
          Operating rules — curfew and rate guardrails apply to every new rental.
        </p>
      </div>
      <OrgOperationsForm orgId={orgId} initial={initial} />
    </div>
  );
}
