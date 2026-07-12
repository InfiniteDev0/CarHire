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

  return <OnboardingFlow />;
}
