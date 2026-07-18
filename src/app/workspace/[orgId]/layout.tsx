import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/workspace/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveClock } from "@/components/workspace/live-clock";
import { NotificationSheet } from "@/features/workspace/notification-sheet";
import { PresenceHeartbeat } from "@/features/workspace/presence-heartbeat";
import { MobileBottomNav } from "@/components/workspace/mobile-bottom-nav";
import { getWorkspaceNotifications } from "@/features/workspace/notifications";
import { WorkspaceBreadcrumb } from "@/features/workspace/workspace-breadcrumb";
import { WorkspaceStoreHydrator } from "@/components/workspace/workspace-store-hydrator";
import type { MemberRole } from "@/lib/auth/membership";
import { getOrgUsage, isAnyLimitReached, PLAN_LABELS, type OrgPlan } from "@/lib/limits";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { RainbowButton } from "@/components/ui/rainbow-button";

/**
 * Workspace shell — sidebar + header, applied to every /workspace/[orgId] page.
 * Guards membership server-side: RLS only returns the org row if the user is a
 * member, so a missing row means "not your org" → back to the entry router.
 */
export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();
  
 
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, plan")
    .eq("id", orgId)
    .maybeSingle();
  if (!org) redirect("/");
  const plan = ((org.plan as OrgPlan) ?? "FREE") satisfies OrgPlan;

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();
  const role = (membership?.role ?? null) as MemberRole | null;

  const [usage, notifications, { data: myMemberships }, { count: staffCount }] =
    await Promise.all([
      getOrgUsage(supabase, orgId),
      getWorkspaceNotifications(supabase, orgId),
      supabase
        .from("org_members")
        .select("role, organizations(id, name, plan)")
        .eq("user_id", user.id)
        .eq("is_active", true),
      supabase
        .from("org_members")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId)
        .eq("is_active", true),
    ]);
  const atLimit = plan === "FREE" && isAnyLimitReached(usage);

  // Every business this user belongs to — powers the workspace switcher.
  interface MembershipJoin {
    role: "admin" | "staff";
    organizations: { id: string; name: string; plan: OrgPlan | null } | null;
  }
  const workspaces = ((myMemberships ?? []) as unknown as MembershipJoin[])
    .filter((m) => m.organizations)
    .map((m) => ({
      id: m.organizations!.id,
      name: m.organizations!.name,
      plan: (m.organizations!.plan ?? "FREE") as OrgPlan,
      role: m.role,
    }));
  // Extra workspaces are a Business-plan feature.
  const canCreateWorkspace = workspaces.some(
    (w) => w.role === "admin" && w.plan === "BUSINESS"
  );

  const displayName =
    (user.user_metadata?.full_name as string) || user.email || "User";

  return (
    <TooltipProvider>
      <SidebarProvider>
        <WorkspaceStoreHydrator
          orgId={org.id}
          orgName={org.name}
          role={role}
          userName={displayName}
          userEmail={user.email ?? ""}
        />
        <PresenceHeartbeat orgId={org.id} />
        <AppSidebar
          orgId={org.id}
          orgName={org.name}
          user={{ name: displayName, email: user.email ?? "", avatar: "" }}
          plan={plan}
          staffCount={staffCount ?? 0}
          isAdmin={role === "admin"}
          workspaces={workspaces}
          canCreateWorkspace={canCreateWorkspace}
        />
        <SidebarInset className="h-svh overflow-hidden">
          <header className="flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center justify-between gap-2 w-full px-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Separator
                  orientation="vertical"
                  className="mr-2 data-vertical:h-4 data-vertical:self-auto"
                />
                <WorkspaceBreadcrumb orgId={org.id} orgName={org.name} />
              </div>
              <div className="flex items-center gap-5">
                <LiveClock />
                {/* cta */}
                <div className="flex items-center gap-2">
                  {plan === "FREE" ? (
                    <RainbowButton
                      asChild
                      variant="outline"
                      className="h-fit p-1 px-2 cursor-pointer rounded-sm text-xs"
                    >
                      <Link href={`/workspace/${orgId}/pricing`}>
                        <Crown />
                        Upgrade to Pro
                      </Link>
                    </RainbowButton>
                  ) : (
                    <Badge className="gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      <Crown className="size-3" />
                      {PLAN_LABELS[plan]}
                    </Badge>
                  )}
                  {/* notification trigger and sheet */}
                  <NotificationSheet orgId={org.id} notifications={notifications} />
                </div>
              </div>
            </div>
          </header>
          {/* banner — only when a free-plan limit is reached */}
          {atLimit && (
            <div className="flex h-7 w-full items-center justify-center gap-2 bg-red-400 text-sm text-red-950">
              <p>Free plan limit reached.</p>
              <Link
                href={`/workspace/${orgId}/pricing`}
                className="font-medium underline"
              >
                Upgrade to Pro
              </Link>
            </div>
          )}
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto scrollbar-pill p-4 pb-28 md:pb-4">
            {children}
          </div>
          <MobileBottomNav
            orgId={org.id}
            orgName={org.name}
            userName={displayName}
            userEmail={user.email ?? ""}
            isAdmin={role === "admin"}
            vehicleCount={usage.vehicles}
          />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
