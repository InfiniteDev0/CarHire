"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Car } from "lucide-react";

import { NavUser } from "@/components/workspace/nav-user";
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
}

export function AppSidebar({
  orgId,
  orgName,
  user,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname();
  const base = `/workspace/${orgId}`;

  const items = WORKSPACE_NAV_ITEMS.map((item) => ({
    ...item,
    url: navItemUrl(base, item),
  }));

  
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="bg-black"
              render={<Link href={base} />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Car className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{orgName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  Workspace
                </span>
              </div>
            </SidebarMenuButton>
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
                    className="text-muted-foreground data-active:bg-transparent data-active:text-foreground data-active:font-medium group-data-[collapsible=icon]:data-active:bg-black group-data-[collapsible=icon]:data-active:text-white"
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                  {active && (
                    <motion.div
                      layoutId="sidebar-active-indicator"
                      className="absolute inset-y-1.5 left-0 w-0.75 rounded-full bg-cyan-500 group-data-[collapsible=icon]:hidden"
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
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
