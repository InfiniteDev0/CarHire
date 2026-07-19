import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Car, ChevronRight } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import {
  PLAN_LABELS,
  workspaceAllowance,
  workspaceLimitMessage,
  bestPlan,
  type OrgPlan,
} from "@/lib/limits";
import { NewWorkspaceButton } from "@/features/workspace/new-workspace-button";

export const metadata = { title: "Choose a workspace · CarHire" };

/** Landing picker for users who belong to more than one business. */
export default async function SelectOrgPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data } = await supabase
    .from("org_members")
    .select("role, organizations(id, name, plan)")
    .eq("user_id", user.id)
    .eq("is_active", true);

  interface MembershipJoin {
    role: "admin" | "staff";
    organizations: { id: string; name: string; plan: OrgPlan | null } | null;
  }
  const workspaces = ((data ?? []) as unknown as MembershipJoin[])
    .filter((m) => m.organizations)
    .map((m) => ({
      id: m.organizations!.id,
      name: m.organizations!.name,
      plan: (m.organizations!.plan ?? "FREE") as OrgPlan,
      role: m.role,
    }));

  if (workspaces.length === 0) redirect("/onboarding");
  if (workspaces.length === 1) redirect(`/workspace/${workspaces[0].id}`);

  const adminPlans = workspaces.filter((w) => w.role === "admin").map((w) => w.plan);
  const canCreateWorkspace = adminPlans.length < workspaceAllowance(adminPlans);
  const workspaceMessage = workspaceLimitMessage(bestPlan(adminPlans));
  // Where "upgrade to create more" should send them — their first admin org.
  const upgradeOrgId = workspaces.find((w) => w.role === "admin")?.id ?? null;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image src="/logo.png" alt="" width={44} height={44} className="rounded-xl" />
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Choose a workspace</h1>
          <p className="text-sm text-muted-foreground">
            You belong to {workspaces.length} businesses — pick where to work today.
          </p>
        </div>
      </div>

      <div className="flex w-full max-w-md flex-col gap-3">
        {workspaces.map((w) => (
          <Link
            key={w.id}
            href={`/workspace/${w.id}`}
            className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-muted-foreground/40 hover:bg-muted/40"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Car className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{w.name}</p>
              <p className="text-xs text-muted-foreground">
                {w.role === "admin" ? "Admin" : "Staff"}
              </p>
            </div>
            <Badge variant="secondary">{PLAN_LABELS[w.plan]}</Badge>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}

        {upgradeOrgId && (
          <NewWorkspaceButton
            canCreateWorkspace={canCreateWorkspace}
            upgradeOrgId={upgradeOrgId}
            workspaceMessage={workspaceMessage}
          />
        )}
      </div>
    </div>
  );
}
