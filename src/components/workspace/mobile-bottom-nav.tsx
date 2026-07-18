"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  LayoutDashboard,
  LayoutGrid,
  Car,
  FileText,
  UserRound,
  UserPlus,
  Wallet,
  TriangleAlert,
  Calendar,
  Settings2,
  Users,
  LogOut,
  ChevronRight,
  ChevronDown,
  Check,
  Loader2,
  Search,
  Plus,
  Crown,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RainbowButton } from "@/components/ui/rainbow-button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { SidePanel } from "@/components/workspace/side-panel";
import { NotificationSheet, type WorkspaceNotification } from "@/features/workspace/notification-sheet";
import { inviteStaffByEmail } from "@/features/staff/actions";
import { PLAN_LABELS, type OrgPlan } from "@/lib/limits";
import type { WorkspaceEntry } from "@/features/workspace/workspace-switcher";

const PILL_ITEMS: { title: string; segment: string; icon: LucideIcon }[] = [
  { title: "Home", segment: "", icon: LayoutDashboard },
  { title: "Vehicles", segment: "vehicles", icon: Car },
  { title: "Rentals", segment: "rentals", icon: FileText },
];

// Everything that lives inside the expanding grid (ClickUp "apps" style).
const GRID_APPS: {
  title: string;
  segment: string;
  icon: LucideIcon;
  className: string;
  adminOnly?: boolean;
}[] = [
  { title: "Clients", segment: "clients", icon: UserRound, className: "bg-purple-500" },
  { title: "Finance", segment: "financials", icon: Wallet, className: "bg-emerald-500" },
  { title: "Calendar", segment: "calendar", icon: Calendar, className: "bg-pink-500" },
  { title: "Complaints", segment: "complaints", icon: TriangleAlert, className: "bg-amber-500" },
  { title: "Staff", segment: "staff", icon: Users, className: "bg-sky-500", adminOnly: true },
  { title: "Settings", segment: "settings", icon: Settings2, className: "bg-zinc-600" },
];

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "U"
  );
}

/* ── Search drawer (opened from the bar under the topbar) ──────────────── */

interface SearchHit {
  id: string;
  kind: "CLIENT" | "VEHICLE";
  title: string;
  detail: string;
}

function SearchSheet({
  orgId,
  open,
  onClose,
}: {
  orgId: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"ALL" | "VEHICLE" | "CLIENT">("ALL");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [busy, setBusy] = useState(false);
  const base = `/workspace/${orgId}`;

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      const t = setTimeout(() => setHits([]), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const supabase = createClient();
        const like = `%${q}%`;
        const [clientsRes, carsRes] = await Promise.all([
          supabase
            .from("clients")
            .select("id, full_name, phone, national_id")
            .eq("org_id", orgId)
            .or(`full_name.ilike.${like},phone.ilike.${like},national_id.ilike.${like}`)
            .limit(6),
          supabase
            .from("cars")
            .select("id, reg_number, make, model")
            .eq("org_id", orgId)
            .is("decommissioned_at", null)
            .or(`reg_number.ilike.${like},make.ilike.${like},model.ilike.${like}`)
            .limit(6),
        ]);
        setHits([
          ...(clientsRes.data ?? []).map((c) => ({
            id: c.id as string,
            kind: "CLIENT" as const,
            title: c.full_name as string,
            detail: [c.phone, c.national_id].filter(Boolean).join(" · "),
          })),
          ...(carsRes.data ?? []).map((c) => ({
            id: c.id as string,
            kind: "VEHICLE" as const,
            title: c.reg_number as string,
            detail: [c.make, c.model].filter(Boolean).join(" "),
          })),
        ]);
      } finally {
        setBusy(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, open, orgId]);

  const shown = hits.filter((h) => filter === "ALL" || h.kind === filter);

  function openHit(h: SearchHit) {
    onClose();
    setQuery("");
    router.push(h.kind === "CLIENT" ? `${base}/clients` : `${base}/vehicles`);
  }

  return (
    <SidePanel open={open} onClose={onClose}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients & vehicles…"
            className="h-11 rounded-full pl-9"
          />
        </div>
        <button type="button" onClick={onClose} className="text-sm text-zinc-500">
          Cancel
        </button>
      </div>

      <div className="flex gap-1.5">
        {(
          [
            ["ALL", "All"],
            ["VEHICLE", "Vehicles"],
            ["CLIENT", "Clients"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              filter === id
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-black"
                : "border-zinc-300 text-zinc-500 dark:border-zinc-700"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-40 flex-1">
        {busy && (
          <div className="flex justify-center py-6">
            <Loader2 className="size-4 animate-spin text-zinc-500" />
          </div>
        )}
        {!busy && query.trim().length >= 2 && shown.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-500">Nothing matches “{query}”.</p>
        )}
        {!busy && query.trim().length < 2 && (
          <p className="py-8 text-center text-sm text-zinc-500">
            Type at least 2 characters to search your workspace.
          </p>
        )}
        <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
          {shown.map((h) => (
            <button
              key={`${h.kind}-${h.id}`}
              type="button"
              onClick={() => openHit(h)}
              className="flex items-center gap-3 py-3 text-left"
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-lg",
                  h.kind === "CLIENT"
                    ? "bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
                    : "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                )}
              >
                {h.kind === "CLIENT" ? <UserRound className="size-4" /> : <Car className="size-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{h.title}</p>
                {h.detail && <p className="truncate text-xs text-zinc-500">{h.detail}</p>}
              </div>
              <ChevronRight className="size-4 text-zinc-400" />
            </button>
          ))}
        </div>
      </div>
    </SidePanel>
  );
}

/* ── Create drawer (the "+" button) ────────────────────────────────────── */

function CreateSheet({
  orgId,
  isAdmin,
  open,
  onClose,
}: {
  orgId: string;
  isAdmin: boolean;
  open: boolean;
  onClose: () => void;
}) {
  const base = `/workspace/${orgId}`;
  const actions: {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
    className: string;
    adminOnly?: boolean;
  }[] = [
    {
      title: "New rental",
      description: "Start an agreement — client, car, deposit",
      href: `${base}/rentals?new=1`,
      icon: FileText,
      className: "bg-blue-500 text-white",
    },
    {
      title: "Add client",
      description: "Register a hirer with full KYC",
      href: `${base}/clients?new=1`,
      icon: UserPlus,
      className: "bg-purple-500 text-white",
    },
    {
      title: "Add vehicle",
      description: "Put a new car in the fleet",
      href: `${base}/vehicles?new=1`,
      icon: Car,
      className: "bg-emerald-500 text-white",
      adminOnly: true,
    },
    {
      title: "Record expense",
      description: "Fuel, service, repairs — log the cost",
      href: `${base}/financials`,
      icon: Wallet,
      className: "bg-red-500 text-white",
    },
    {
      title: "File complaint",
      description: "Log an incident on a rental or car",
      href: `${base}/complaints?new=1`,
      icon: TriangleAlert,
      className: "bg-amber-500 text-white",
    },
  ];

  return (
    <SidePanel open={open} onClose={onClose}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Create</h2>
        <Button
          onClick={onClose}
          className="size-8 rounded-full bg-zinc-200 p-0 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-white dark:hover:bg-zinc-700"
        >
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {actions
          .filter((a) => isAdmin || !a.adminOnly)
          .map((a) => (
            <Link
              key={a.title}
              href={a.href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  a.className
                )}
              >
                <a.icon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{a.title}</p>
                <p className="truncate text-xs text-zinc-500">{a.description}</p>
              </div>
              <ChevronRight className="size-4 text-zinc-400" />
            </Link>
          ))}
      </div>
    </SidePanel>
  );
}

/* ── The mobile shell: topbar + search bar + glass pill + drawers ──────── */

export function MobileShell({
  orgId,
  orgName,
  plan,
  userName,
  userEmail,
  isAdmin,
  vehicleCount,
  workspaces,
  canCreateWorkspace,
  notifications,
}: {
  orgId: string;
  orgName: string;
  plan: OrgPlan;
  userName: string;
  userEmail: string;
  isAdmin: boolean;
  vehicleCount: number;
  workspaces: WorkspaceEntry[];
  canCreateWorkspace: boolean;
  notifications: WorkspaceNotification[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/workspace/${orgId}`;

  const [workspacesOpen, setWorkspacesOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [gridOpen, setGridOpen] = useState(false);
  const [snap, setSnap] = useState<number | string | null>(0.95);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleInvite() {
    if (inviting) return;
    setInviting(true);
    try {
      await inviteStaffByEmail(orgId, inviteEmail);
      toast.success(`Invite sent to ${inviteEmail.trim()}`);
      setInviteEmail("");
      setInviteOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't send the invite.");
    } finally {
      setInviting(false);
    }
  }

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      toast.success("Shift ended — signed out");
      router.replace("/auth");
      router.refresh();
    } catch {
      setSigningOut(false);
    }
  }

  function goToNewWorkspace() {
    setWorkspacesOpen(false);
    if (canCreateWorkspace) {
      router.push("/onboarding");
    } else {
      toast.error("Upgrade to the Business plan to run more than one workspace.");
      router.push(`${base}/pricing`);
    }
  }

  return (
    <>
      {/* ── Topbar (ClickUp style) — replaces the desktop header on mobile ── */}
      <div className="flex flex-col gap-2 border-b px-3 pb-2 pt-2 md:hidden">
        <div className="flex items-center justify-between gap-2">
          {/* Workspace: avatar + name + chevron → workspaces drawer */}
          <button
            type="button"
            onClick={() => setWorkspacesOpen(true)}
            className="flex min-w-0 items-center gap-2"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white">
              {orgName.charAt(0).toUpperCase()}
            </span>
            <span className="truncate text-base font-semibold">{orgName}</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>

          <div className="flex shrink-0 items-center gap-3">
            {isAdmin && (
              <button
                type="button"
                aria-label="Invite members"
                onClick={() => setInviteOpen(true)}
                className="text-foreground"
              >
                <UserPlus className="size-5" />
              </button>
            )}
            <button
              type="button"
              aria-label="Profile"
              onClick={() => setProfileOpen(true)}
              className="flex size-8 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background"
            >
              {initials(userName)}
            </button>
          </div>
        </div>

        {/* Search bar under the topbar */}
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex h-10 items-center gap-2 rounded-xl bg-muted px-3 text-sm text-muted-foreground"
        >
          <Search className="size-4" />
          Search
        </button>
      </div>

      {/* ── Liquid-glass pill + "+" ───────────────────────────────────────── */}
      <nav className="fixed inset-x-0 bottom-4 z-40 flex items-center justify-center gap-2 md:hidden">
        {/* Expanding apps grid */}
        <AnimatePresence>
          {gridOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 16 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              style={{ transformOrigin: "bottom center" }}
              className="liquid-glass absolute bottom-full mb-3 grid grid-cols-3 gap-3 rounded-3xl p-4"
            >
              {GRID_APPS.filter((a) => isAdmin || !a.adminOnly).map((a) => {
                const url = `${base}/${a.segment}`;
                return (
                  <Link
                    key={a.segment}
                    href={url}
                    onClick={() => setGridOpen(false)}
                    className="flex w-16 flex-col items-center gap-1.5"
                  >
                    <span
                      className={cn(
                        "flex size-11 items-center justify-center rounded-2xl text-white shadow-sm",
                        a.className
                      )}
                    >
                      <a.icon className="size-5" />
                    </span>
                    <span className="text-[10px] font-medium text-foreground/80">{a.title}</span>
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="liquid-glass flex items-center gap-1 rounded-full p-1.5">
          {PILL_ITEMS.map((item) => {
            const url = item.segment ? `${base}/${item.segment}` : base;
            const active = item.segment ? pathname.startsWith(url) : pathname === base;
            return (
              <Link
                key={item.title}
                href={url}
                aria-label={item.title}
                onClick={() => setGridOpen(false)}
                className={cn(
                  "relative flex size-11 items-center justify-center rounded-full transition-colors",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="mobile-pill-active"
                    className="liquid-glass-blob absolute inset-0 rounded-full"
                    transition={{ type: "spring", stiffness: 450, damping: 34 }}
                  />
                )}
                <item.icon className="relative size-5" />
              </Link>
            );
          })}

          {/* Notifications — same live feed as desktop */}
          <NotificationSheet
            orgId={orgId}
            notifications={notifications}
            triggerClassName="size-11 w-11 rounded-full border-0 bg-transparent text-muted-foreground shadow-none"
          />

          {/* Expand the rest */}
          <button
            type="button"
            aria-label="More apps"
            onClick={() => setGridOpen((v) => !v)}
            className={cn(
              "relative flex size-11 items-center justify-center rounded-full transition-colors",
              gridOpen ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {gridOpen && <span className="liquid-glass-blob absolute inset-0 rounded-full" />}
            <LayoutGrid className="relative size-5" />
          </button>
        </div>

        {/* “+” create — separate glass circle */}
        <button
          type="button"
          aria-label="Create"
          onClick={() => setCreateOpen(true)}
          className="liquid-glass flex size-13 items-center justify-center rounded-full text-foreground"
        >
          <Plus className="size-6" />
        </button>
      </nav>

      {/* ── Workspaces drawer ─────────────────────────────────────────────── */}
      <Drawer open={workspacesOpen} onOpenChange={setWorkspacesOpen}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle>Workspaces</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-1 px-4 pb-2">
            {workspaces.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => {
                  setWorkspacesOpen(false);
                  if (w.id !== orgId) router.push(`/workspace/${w.id}`);
                }}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-muted"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-sm font-bold text-white">
                  {w.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{w.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {w.role === "admin" ? "Admin" : "Staff"} · {PLAN_LABELS[w.plan]}
                  </p>
                </div>
                {w.id === orgId && (
                  <span className="flex size-5 items-center justify-center rounded-full bg-blue-500 text-white">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="p-4 pt-1">
            <Button className="h-11 w-full rounded-xl" onClick={goToNewWorkspace}>
              <Plus className="size-4" />
              Create Workspace
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* ── Invite members drawer ─────────────────────────────────────────── */}
      <Drawer open={inviteOpen} onOpenChange={setInviteOpen}>
        <DrawerContent>
          <DrawerHeader className="text-center">
            <DrawerTitle>Invite members</DrawerTitle>
          </DrawerHeader>
          <div className="flex flex-col gap-3 p-4 pt-0">
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="Email"
              className="h-11 rounded-xl"
              disabled={inviting}
            />
            <Button
              className="h-11 w-full rounded-xl"
              disabled={inviting || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail.trim())}
              onClick={handleInvite}
            >
              {inviting && <Loader2 className="size-4 animate-spin" />}
              Invite
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              They join this workspace as staff and set a password from the email.
            </p>
          </div>
        </DrawerContent>
      </Drawer>

      {/* ── Profile drawer — near-full height, drag to resize/close ───────── */}
      <Drawer
        open={profileOpen}
        onOpenChange={setProfileOpen}
        snapPoints={[0.5, 0.95]}
        activeSnapPoint={snap}
        setActiveSnapPoint={setSnap}
      >
        <DrawerContent className="h-[95svh] max-h-none">
          <DrawerHeader className="text-center">
            <DrawerTitle>Profile &amp; Settings</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto scrollbar-pill px-4 pb-8">
            <div className="flex flex-col items-center gap-2 pb-4 text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-foreground text-xl font-bold text-background">
                {initials(userName)}
              </span>
              <div>
                <p className="text-lg font-semibold">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{isAdmin ? "Admin" : "Staff"}</Badge>
                <span className="text-xs text-muted-foreground">{orgName}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {vehicleCount} vehicle{vehicleCount === 1 ? "" : "s"} in the fleet
              </p>

              {/* Upgrade lives here on mobile */}
              {plan === "FREE" && isAdmin ? (
                <RainbowButton
                  asChild
                  variant="outline"
                  className="mt-1 h-9 rounded-xl px-4 text-sm"
                >
                  <Link href={`${base}/pricing`} onClick={() => setProfileOpen(false)}>
                    <Crown className="size-4" />
                    Upgrade to Pro
                  </Link>
                </RainbowButton>
              ) : (
                <Badge className="gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  <Crown className="size-3" />
                  {PLAN_LABELS[plan]} plan
                </Badge>
              )}
            </div>

            <div className="flex flex-col divide-y divide-border rounded-xl border">
              {[
                { title: "Clients", segment: "clients", icon: UserRound },
                { title: "Finance", segment: "financials", icon: Wallet },
                { title: "Calendar", segment: "calendar", icon: Calendar },
                { title: "Complaints", segment: "complaints", icon: TriangleAlert },
                ...(isAdmin ? [{ title: "Staff", segment: "staff", icon: Users }] : []),
                { title: "Settings", segment: "settings", icon: Settings2 },
              ].map((l) => (
                <Link
                  key={l.segment}
                  href={`${base}/${l.segment}`}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted"
                >
                  <l.icon className="size-4 text-muted-foreground" />
                  <span className="flex-1">{l.title}</span>
                  <ChevronRight className="size-4 text-muted-foreground/60" />
                </Link>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
            >
              {signingOut ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
              Log out — end shift
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Search + Create drawers */}
      <SearchSheet orgId={orgId} open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CreateSheet
        orgId={orgId}
        isAdmin={isAdmin}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </>
  );
}
