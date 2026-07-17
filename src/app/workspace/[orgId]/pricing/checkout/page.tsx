import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/membership";
import { createClient } from "@/lib/supabase/server";
import { paystackConfigured } from "@/lib/paystack";
import { CheckoutView } from "@/features/billing/components/checkout-view";

export const metadata = { title: "Checkout · CarHire" };

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ plan?: string }>;
}) {
  const { orgId } = await params;
  const { plan: planParam } = await searchParams;
  await requireAdmin(orgId);

  const plan = planParam?.toUpperCase() === "BUSINESS" ? "BUSINESS" : "PRO";

  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("name, plan")
    .eq("id", orgId)
    .maybeSingle();
  if (!org) redirect("/");
  if (org.plan === plan) redirect(`/workspace/${orgId}/pricing`);

  return (
    <CheckoutView
      orgId={orgId}
      orgName={org.name}
      plan={plan}
      paymentsEnabled={paystackConfigured()}
    />
  );
}
