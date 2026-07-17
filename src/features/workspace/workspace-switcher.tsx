"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Car, Check, ChevronsUpDown, Crown, Plus, Settings2, Users } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { PLAN_LABELS, type OrgPlan } from "@/lib/limits";

export interface WorkspaceEntry {
  id: string;
  name: string;
  plan: OrgPlan;
  role: "admin" | "staff";
}

export function WorkspaceSwitcher({
  orgId,
  orgName,
  plan,
  staffCount,
  isAdmin,
  workspaces,
  canCreateWorkspace,
}: {
  orgId: string;
  orgName: string;
  plan: OrgPlan;
  staffCount: number;
  isAdmin: boolean;
  workspaces: WorkspaceEntry[];
  canCreateWorkspace: boolean;
}) {
  const router = useRouter();
  const base = `/workspace/${orgId}`;
  const others = workspaces.filter((w) => w.id !== orgId);

  function handleNewWorkspace() {
    if (canCreateWorkspace) {
      router.push("/onboarding");
    } else {
      toast.error("Upgrade to the Business plan to run more than one workspace.");
      router.push(`${base}/pricing`);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <SidebarMenuButton size="lg" className="bg-accent">
            <div className="flex aspect-square size-8 items-center justify-center rounded-sm bg-sidebar-primary text-sidebar-primary-foreground">
              <Car className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{orgName}</span>
              <span className="truncate text-xs text-muted-foreground">
                {PLAN_LABELS[plan]} plan
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
          </SidebarMenuButton>
        }
      />
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="w-72 rounded-sm bg-background p-0"
      >
        {/* Current business */}
        <div className="flex items-start gap-3 p-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Car className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{orgName}</p>
            <p className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              {staffCount} staff · {PLAN_LABELS[plan]} plan
              {plan === "FREE" && isAdmin && (
                <Link
                  href={`${base}/pricing`}
                  className="inline-flex items-center gap-0.5 font-medium text-amber-600 hover:underline dark:text-amber-400"
                >
                  <Crown className="size-3" />
                  Upgrade
                </Link>
              )}
            </p>
          </div>
        </div>

        {/* Quick links */}
        <div className={cn("grid gap-2 px-3 pb-3", isAdmin ? "grid-cols-2" : "grid-cols-1")}>
          <Button asChild variant="outline" className="h-8 justify-center gap-1.5 text-xs">
            <Link href={`${base}/settings`}>
              <Settings2 className="size-3.5" />
              Settings
            </Link>
          </Button>
          {isAdmin && (
            <Button asChild variant="outline" className="h-8 justify-center gap-1.5 text-xs">
              <Link href={`${base}/staff`}>
                <Users className="size-3.5" />
                Staff
              </Link>
            </Button>
          )}
        </div>

        {/* Switch business */}
        <DropdownMenuSeparator className="my-0" />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-3 pt-2 text-xs font-medium text-muted-foreground">
            Switch business
          </DropdownMenuLabel>
          {workspaces.map((w) => (
            <DropdownMenuItem
              key={w.id}
              className="mx-1 gap-2 rounded-lg"
              onClick={() => {
                if (w.id !== orgId) router.push(`/workspace/${w.id}`);
              }}
            >
              <span className="flex size-6 items-center justify-center rounded-md bg-muted text-[10px] font-bold uppercase">
                {w.name.charAt(0)}
              </span>
              <span className="flex-1 truncate text-sm">{w.name}</span>
              {w.id === orgId && <Check className="size-4" />}
            </DropdownMenuItem>
          ))}
          {others.length === 0 && (
            <p className="px-3 pb-1 text-xs text-muted-foreground">
              This is your only workspace.
            </p>
          )}
        </DropdownMenuGroup>

        {/* New business — gated to the Business plan */}
        <div className="p-2">
          <Button
            variant="outline"
            className="h-9 w-full justify-center gap-1.5 rounded-lg text-sm"
            onClick={handleNewWorkspace}
          >
            <Plus className="size-4" />
            New business
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
