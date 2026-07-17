import { requireAdmin } from "@/lib/auth/membership";
import { createClient } from "@/lib/supabase/server";
import {
  OrgGeneralForm,
  type OrgGeneral,
} from "@/features/settings/components/org-general-form";

export const metadata = { title: "General · Settings · CarHire" };

export default async function GeneralSettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  await requireAdmin(orgId);

  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("name, phone, county")
    .eq("id", orgId)
    .maybeSingle();

  const initial: OrgGeneral = {
    name: org?.name ?? "",
    phone: org?.phone ?? "",
    county: org?.county ?? "",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h2 className="text-sm font-medium">General</h2>
        <p className="text-xs text-muted-foreground">
          Your business identity — shown across the workspace and on documents.
        </p>
      </div>
      <OrgGeneralForm orgId={orgId} initial={initial} />
    </div>
  );
}
