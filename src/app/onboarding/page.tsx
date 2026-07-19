import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OnboardingFlow from "@/features/onboarding/components/OnboardingFlow";

export const metadata = { title: "Create your workspace · CarHire" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  // If they already admin a workspace, this is an *additional* one — it inherits
  // their paid plan, so the plan step is skipped.
  const { count } = await supabase
    .from("org_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("role", "admin")
    .eq("is_active", true);

  return <OnboardingFlow isAdditional={(count ?? 0) > 0} />;
}
