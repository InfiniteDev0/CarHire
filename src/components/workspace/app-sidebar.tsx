"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandMark } from "@/components/brand/logo";
import { BRAND } from "@/lib/brand";
import { WORKSPACE_NAV_ITEMS, navItemUrl } from "@/features/workspace/nav-items";
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
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  orgId: string;
  isAdmin: boolean;
}

const ITEM =
  "nav-icon h-10 gap-3 px-3 text-[15px] text-white/70 hover:bg-white/10 hover:text-white active:bg-white/15 active:text-white data-[current]:bg-white/20 data-[current]:font-medium data-[current]:text-white [&_svg]:size-[18px] group-data-[collapsible=icon]:h-[3.25rem]! group-data-[collapsible=icon]:w-full! group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-1 group-data-[collapsible=icon]:p-1! group-data-[collapsible=icon]:text-[11px] group-data-[collapsible=icon]:leading-none";

/**
 * The black navigation card. Order: fold toggle → main nav → Settings pinned
 * at the bottom → brand mark. The workspace switcher and account menu live in
 * the top bar.
 */
export function AppSidebar({ orgId, isAdmin, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const base = `/workspace/${orgId}`;

  const items = WORKSPACE_NAV_ITEMS
    // The staff list is admin-only — staff shouldn't even see the entry.
    .filter((item) => isAdmin || item.segment !== "staff")
    .map((item) => ({ ...item, url: navItemUrl(base, item) }));

  const isActive = (url: string) => (url === base ? pathname === base : pathname.startsWith(url));
  const main = items.filter((i) => i.segment !== "settings");
  const settings = items.find((i) => i.segment === "settings");

  const row = (item: (typeof items)[number]) => {
    const active = isActive(item.url);
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          isActive={active}
          data-current={active || undefined}
          render={<Link href={item.url} />}
          className={ITEM}
        >
          <item.icon />
          <span>{item.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar variant="floating" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarTrigger className="size-9 text-white/70 hover:bg-white/10 hover:text-white" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-1">{main.map(row)}</SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {settings && <SidebarMenu>{row(settings)}</SidebarMenu>}
        <a
          href={BRAND.companyUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 px-3 py-2 text-xs text-white/50 transition-colors hover:text-white group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <BrandMark className="size-4" />
          <span className="truncate group-data-[collapsible=icon]:hidden">
            <span className="font-medium text-white/80">{BRAND.name}</span> by {BRAND.company}
          </span>
        </a>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
