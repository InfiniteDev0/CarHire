"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { WORKSPACE_NAV_ITEMS, navItemUrl } from "@/features/workspace/nav-items";

/**
 * Gradient definitions for navigation icons — the product's one flourish.
 * Icons are grey at rest, yellow→pink on hover and yellow→green when active
 * (see `.nav-icon` in globals.css). Render once per page.
 */
export function NavGradients() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute">
      <defs>
        <linearGradient id="nav-grad-hover" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0" stopColor="#ffd600" />
          <stop offset="1" stopColor="#ff007a" />
        </linearGradient>
        <linearGradient id="nav-grad-active" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0" stopColor="#ffd600" />
          <stop offset="1" stopColor="#00d078" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Second navigation row — the black nav card laid out horizontally. Together
 * with the top bar it forms the two-row desktop navigation.
 */
export function TopNav({ orgId, isAdmin }: { orgId: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const base = `/workspace/${orgId}`;

  const items = WORKSPACE_NAV_ITEMS
    // The staff list is admin-only — staff shouldn't even see the entry.
    .filter((item) => isAdmin || item.segment !== "staff")
    .map((item) => ({ ...item, url: navItemUrl(base, item) }));

  const isActive = (url: string) => (url === base ? pathname === base : pathname.startsWith(url));
  const main = items.filter((i) => i.segment !== "settings");
  const settings = items.find((i) => i.segment === "settings");

  const link = (item: (typeof items)[number]) => {
    const active = isActive(item.url);
    return (
      <Link
        key={item.title}
        href={item.url}
        aria-current={active ? "page" : undefined}
        data-current={active || undefined}
        className={cn(
          "nav-icon flex h-9 shrink-0 items-center gap-2.5 rounded-md px-3 text-[15px] text-white/70 transition-colors hover:text-white",
          active && "bg-white/20 font-medium text-white",
        )}
      >
        <item.icon className="size-[18px]" />
        {item.title}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Workspace"
      className="mx-2 mb-2 hidden h-12 shrink-0 items-center gap-1 overflow-x-auto rounded-lg bg-black px-1.5 md:flex [scrollbar-width:none]"
    >
      {main.map(link)}
      {settings && <span className="ml-auto flex shrink-0">{link(settings)}</span>}
    </nav>
  );
}
