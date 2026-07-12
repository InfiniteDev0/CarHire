import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Entry router — no marketing page. Decide where a visitor lands:
 *   - not signed in        → /auth
 *   - signed in, 0 orgs    → /onboarding
 *   - signed in, 1 org     → /workspace/[orgId]
 *   - signed in, >1 orgs   → /select-org
 */
export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: memberships } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("user_id", user.id)
    .eq("is_active", true);

  if (!memberships || memberships.length === 0) redirect("/onboarding");
  if (memberships.length === 1) redirect(`/workspace/${memberships[0].org_id}`);
  redirect("/select-org");
}
