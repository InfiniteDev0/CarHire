"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

import { NavUser } from "@/components/workspace/nav-user";
import { BrandMark } from "@/components/brand/logo";
import { BRAND } from "@/lib/brand";
import {
  WorkspaceSwitcher,
  type WorkspaceEntry,
} from "@/features/workspace/workspace-switcher";
import type { OrgPlan } from "@/lib/limits";
import {
  WORKSPACE_NAV_ITEMS,
  navItemUrl,
} from "@/features/workspace/nav-items";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  orgId: string;
  orgName: string;
  user: { name: string; email: string; avatar: string };
  plan: OrgPlan;
  staffCount: number;
  isAdmin: boolean;
  workspaces: WorkspaceEntry[];
  canCreateWorkspace: boolean;
  workspaceMessage: string;
}

export function AppSidebar({
  orgId,
  orgName,
  user,
  plan,
  staffCount,
  isAdmin,
  workspaces,
  canCreateWorkspace,
  workspaceMessage,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname();
  const base = `/workspace/${orgId}`;

  const items = WORKSPACE_NAV_ITEMS
    // The staff list is admin-only — staff shouldn't even see the entry.
    .filter((item) => isAdmin || item.segment !== "staff")
    .map((item) => ({
      ...item,
      url: navItemUrl(base, item),
    }));

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <WorkspaceSwitcher
              orgId={orgId}
              orgName={orgName}
              plan={plan}
              staffCount={staffCount}
              isAdmin={isAdmin}
              workspaces={workspaces}
              canCreateWorkspace={canCreateWorkspace}
              workspaceMessage={workspaceMessage}
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {items.map((item) => {
              const active =
                item.url === base
                  ? pathname === base
                  : pathname.startsWith(item.url);
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={active}
                    render={<Link href={item.url} />}
                    className="mb-1 text-muted-foreground data-active:bg-primary/10 data-active:text-foreground data-active:font-medium group-data-[collapsible=icon]:data-active:bg-primary group-data-[collapsible=icon]:data-active:text-primary-foreground"
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                  {active && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className="absolute inset-y-1.5 left-0 w-0.75 rounded-full bg-primary group-data-[collapsible=icon]:hidden"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                      }}
                    />
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <a
          href={BRAND.companyUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground group-data-[collapsible=icon]:hidden"
        >
          <BrandMark className="size-3.5" />
          <span className="truncate">
            <span className="font-medium text-foreground">{BRAND.name}</span> by {BRAND.company}
          </span>
        </a>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
