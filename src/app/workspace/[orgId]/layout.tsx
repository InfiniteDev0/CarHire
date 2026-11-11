import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/workspace/app-sidebar";
import { NavGradients, TopNav } from "@/components/workspace/top-nav";
import { cn } from "@/lib/utils";
import { NavUser } from "@/components/workspace/nav-user";
import { WorkspaceSwitcher } from "@/features/workspace/workspace-switcher";
import { NavLayoutToggle } from "@/features/workspace/nav-layout-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { NAV_LAYOUT_COOKIE, parseNavLayout } from "@/lib/nav-layout";
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
import { MobileShell } from "@/components/workspace/mobile-bottom-nav";
import { getWorkspaceNotifications } from "@/features/workspace/notifications";
import { WorkspaceBreadcrumb } from "@/features/workspace/workspace-breadcrumb";
import { WorkspaceStoreHydrator } from "@/components/workspace/workspace-store-hydrator";
import type { MemberRole } from "@/lib/auth/membership";
import {
  getOrgUsage,
  isAnyLimitReached,
  PLAN_LABELS,
  workspaceAllowance,
  workspaceLimitMessage,
  bestPlan,
  type OrgPlan,
} from "@/lib/limits";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { RainbowButton } from "@/components/ui/rainbow-button";

/**
 * Workspace shell — navigation + header, applied to every /workspace/[orgId] page.
 * Desktop navigation is the user's choice (top navigation or sidebar), saved in a
 * cookie so the right shell renders on the server with no flash.
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
  const navLayout = parseNavLayout((await cookies()).get(NAV_LAYOUT_COOKIE)?.value);
  const useSidebarNav = navLayout === "sidebar";
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
  // Workspace allowance scales with the user's best plan (Free 1 / Pro 3 /
  // Business 6). You may create another until you're at that cap.
  const adminPlans = workspaces.filter((w) => w.role === "admin").map((w) => w.plan);
  const adminCount = adminPlans.length;
  const canCreateWorkspace = adminCount < workspaceAllowance(adminPlans);
  const workspaceMessage = workspaceLimitMessage(bestPlan(adminPlans));

  const displayName =
    (user.user_metadata?.full_name as string) || user.email || "User";

  const isAdmin = role === "admin";
  const account = { name: displayName, email: user.email ?? "", avatar: "" };

  return (
    <TooltipProvider>
      <NavGradients />
      {/* The frame never scrolls — only the main panel's content does. */}
      <SidebarProvider
        className="h-svh flex-col overflow-hidden bg-background"
        style={{ "--sidebar-width": "18rem", "--sidebar-width-icon": "3.5rem" } as CSSProperties}
      >
        <WorkspaceStoreHydrator
          orgId={org.id}
          orgName={org.name}
          role={role}
          userName={displayName}
          userEmail={user.email ?? ""}
        />
        <PresenceHeartbeat orgId={org.id} />

        {/* Top bar — sits on the page background, not a card. */}
        <header className="hidden h-12 shrink-0 items-center justify-between gap-3 px-3 md:flex">
          <div className="flex min-w-0 items-center gap-3">
            <WorkspaceSwitcher
              orgId={org.id}
              orgName={org.name}
              plan={plan}
              staffCount={staffCount ?? 0}
              isAdmin={isAdmin}
              workspaces={workspaces}
              canCreateWorkspace={canCreateWorkspace}
              workspaceMessage={workspaceMessage}
            />
            <WorkspaceBreadcrumb orgId={org.id} orgName={org.name} />
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <LiveClock className="text-base font-medium" />
            {plan === "FREE" ? (
              <RainbowButton
                asChild
                variant="outline"
                className="h-fit cursor-pointer rounded-md p-1 px-2 text-xs"
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
            <div className="flex items-center gap-0.5">
              <NotificationSheet orgId={org.id} notifications={notifications} />
              <ThemeToggle />
              <NavLayoutToggle layout={navLayout} />
            </div>
            <NavUser user={account} menuSide="bottom" />
          </div>
        </header>

        {/* Second nav row (top-navigation layout). */}
        {!useSidebarNav && <TopNav orgId={org.id} isAdmin={isAdmin} />}

        <div className="flex min-h-0 flex-1">
          {useSidebarNav && (
            <AppSidebar
              orgId={org.id}
              isAdmin={isAdmin}
              className="!top-12 !h-[calc(100svh-3rem)] pt-0"
            />
          )}
          <SidebarInset
            className={cn(
              "min-h-0 overflow-hidden bg-canvas md:mb-2 md:mr-2 md:rounded-lg md:border",
              !useSidebarNav && "md:ml-2",
            )}
          >
            {/* banner — only when a free-plan limit is reached */}
            {atLimit && (
              <div className="flex h-7 w-full shrink-0 items-center justify-center gap-2 bg-red-400 text-sm text-red-950">
                <span>Free plan limit reached.</span>
                <Link href={`/workspace/${orgId}/pricing`} className="font-medium underline">
                  Upgrade to Pro
                </Link>
              </div>
            )}
            <MobileShell
              orgId={org.id}
              orgName={org.name}
              plan={plan}
              userName={displayName}
              userEmail={user.email ?? ""}
              isAdmin={role === "admin"}
              vehicleCount={usage.vehicles}
              workspaces={workspaces}
              canCreateWorkspace={canCreateWorkspace}
              workspaceMessage={workspaceMessage}
              notifications={notifications}
            />
            <div className="@container/main flex flex-1 flex-col gap-4 overflow-y-auto scrollbar-pill px-4 py-4 pb-28 md:py-6 md:pb-6 lg:px-6">
              {children}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
