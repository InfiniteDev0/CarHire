import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/membership";
import { createClient } from "@/lib/supabase/server";
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
  const [{ data: org }, { data: { user } }] = await Promise.all([
    supabase.from("organizations").select("name, plan").eq("id", orgId).maybeSingle(),
    supabase.auth.getUser(),
  ]);
  if (!org) redirect("/");
  if (org.plan === plan) redirect(`/workspace/${orgId}/pricing`);

  return (
    <CheckoutView
      orgId={orgId}
      orgName={org.name}
      plan={plan}
      billedTo={(user?.user_metadata?.full_name as string) ?? ""}
    />
  );
}
