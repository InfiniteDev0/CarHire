import { createClient } from "@/lib/supabase/server";
import { PricingSection } from "@/components/pricing-section";
import type { OrgPlan } from "@/lib/limits";

export const metadata = { title: "Pricing · CarHire" };

export default async function PricingPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("plan")
    .eq("id", orgId)
    .maybeSingle();

  const currentPlan = ((org?.plan as OrgPlan) ?? "FREE") satisfies OrgPlan;

  return (
    <div className="py-4">
      <PricingSection orgId={orgId} currentPlan={currentPlan} />
    </div>
  );
}
