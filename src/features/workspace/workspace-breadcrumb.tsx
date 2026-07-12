"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { WORKSPACE_NAV_ITEMS, navItemUrl } from "./nav-items";

export function WorkspaceBreadcrumb({
  orgId,
  orgName,
}: {
  orgId: string;
  orgName: string;
}) {
  const pathname = usePathname();
  const base = `/workspace/${orgId}`;

  const active = WORKSPACE_NAV_ITEMS.find((item) => {
    const url = navItemUrl(base, item);
    return item.segment ? pathname.startsWith(url) : pathname === base;
  });

  const isHome = !active || active.segment === "";

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {isHome ? (
            <BreadcrumbPage className="text-sm font-medium">{orgName}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink render={<Link href={base}>{orgName}</Link>} />
          )}
        </BreadcrumbItem>
        {!isHome && active && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-sm font-medium">
                {active.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
