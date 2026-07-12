import { requireAdmin } from "@/lib/auth/membership";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm, type OrgSettings } from "@/features/settings/components/settings-form";

export const metadata = { title: "Settings · CarHire" };

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  await requireAdmin(orgId); // settings are admin-only

  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("name, phone, county, curfew_start, curfew_end, rate_floor, rate_ceiling")
    .eq("id", orgId)
    .maybeSingle();

  // time columns come back as "HH:MM:SS" — trim for the time inputs.
  const t = (v: string | null) => (v ? v.slice(0, 5) : "");
  const initial: OrgSettings = {
    name: org?.name ?? "",
    phone: org?.phone ?? "",
    county: org?.county ?? "",
    curfewStart: t(org?.curfew_start ?? null),
    curfewEnd: t(org?.curfew_end ?? null),
    rateFloor: org?.rate_floor != null ? String(org.rate_floor) : "",
    rateCeiling: org?.rate_ceiling != null ? String(org.rate_ceiling) : "",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-xl">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Workspace details and operating rules — curfew and rate guardrails
          apply to every new rental.
        </p>
      </div>

      <SettingsForm orgId={orgId} initial={initial} />
    </div>
  );
}
