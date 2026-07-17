"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  ShieldCheck,
  CreditCard,
  UserRound,
  Palette,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  segment: string;
  icon: LucideIcon;
}

const WORKSPACE_ITEMS: NavItem[] = [
  { title: "General", segment: "general", icon: Building2 },
  { title: "Operations", segment: "operations", icon: ShieldCheck },
  { title: "Billing", segment: "billing", icon: CreditCard },
];

const MY_ITEMS: NavItem[] = [
  { title: "Profile", segment: "profile", icon: UserRound },
  { title: "Appearance", segment: "appearance", icon: Palette },
];

function Group({
  label,
  items,
  base,
  active,
}: {
  label: string;
  items: NavItem[];
  base: string;
  active: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="px-2 text-xs font-medium text-muted-foreground">{label}</p>
      {items.map((item) => (
        <Link
          key={item.segment}
          href={`${base}/${item.segment}`}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
            active === item.segment
              ? "bg-background font-medium text-foreground"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          <item.icon className="size-4" />
          {item.title}
        </Link>
      ))}
    </div>
  );
}

export function SettingsNav({ orgId, isAdmin }: { orgId: string; isAdmin: boolean }) {
  const pathname = usePathname();
  const base = `/workspace/${orgId}/settings`;
  const active = pathname.split("/").pop() ?? "";

  return (
    <nav className="flex w-full shrink-0 bg-zinc-900 p-2 rounded-b-md flex-col gap-4 md:w-48">
      {isAdmin && <Group label="Workspace" items={WORKSPACE_ITEMS} base={base} active={active} />}
      <Group label="My settings" items={MY_ITEMS} base={base} active={active} />
    </nav>
  );
}
