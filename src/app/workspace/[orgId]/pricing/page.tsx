import { createClient } from "@/lib/supabase/server";
import { PricingSection } from "@/components/pricing-section";
import { PaymentResultToast } from "@/features/billing/components/payment-result-toast";
import type { OrgPlan } from "@/lib/limits";

export const metadata = { title: "Pricing · CarHire" };

export default async function PricingPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { orgId } = await params;
  const { payment } = await searchParams;
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("plan")
    .eq("id", orgId)
    .maybeSingle();

  const currentPlan = ((org?.plan as OrgPlan) ?? "FREE") satisfies OrgPlan;

  return (
    <div className="py-4">
      <PaymentResultToast result={payment} />
      <PricingSection orgId={orgId} currentPlan={currentPlan} />
    </div>
  );
}
