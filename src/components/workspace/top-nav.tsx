"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";
import { WORKSPACE_NAV_ITEMS, navItemUrl } from "@/features/workspace/nav-items";

/** Horizontal workspace navigation — the alternative to the sidebar on desktop. */
export function TopNav({ orgId, isAdmin }: { orgId: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const base = `/workspace/${orgId}`;

  const items = WORKSPACE_NAV_ITEMS
    // The staff list is admin-only — staff shouldn't even see the entry.
    .filter((item) => isAdmin || item.segment !== "staff")
    .map((item) => ({ ...item, url: navItemUrl(base, item) }));

  return (
    <nav
      aria-label="Workspace"
      className="hidden h-11 shrink-0 items-stretch gap-1 overflow-x-auto border-b px-3 md:flex [scrollbar-width:none]"
    >
      {items.map((item) => {
        const active = item.url === base ? pathname === base : pathname.startsWith(item.url);
        return (
          <Link
            key={item.title}
            href={item.url}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex shrink-0 items-center gap-2 rounded-md px-3 text-sm transition-colors",
              active
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <item.icon className={cn("size-4", active && "text-primary")} />
            {item.title}
            {active && (
              <motion.span
                layoutId="topnav-active-indicator"
                className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
