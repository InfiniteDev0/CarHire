"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  LayoutDashboard,
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
  Loader2,
  Search,
  Plus,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SidePanel } from "@/components/workspace/side-panel";

const PILL_ITEMS: { title: string; segment: string; icon: LucideIcon }[] = [
  { title: "Home", segment: "", icon: LayoutDashboard },
  { title: "Vehicles", segment: "vehicles", icon: Car },
  { title: "Rentals", segment: "rentals", icon: FileText },
];

const MORE_LINKS: { title: string; segment: string; icon: LucideIcon; adminOnly?: boolean }[] = [
  { title: "Clients", segment: "clients", icon: UserRound },
  { title: "Finance", segment: "financials", icon: Wallet },
  { title: "Calendar", segment: "calendar", icon: Calendar },
  { title: "Complaints", segment: "complaints", icon: TriangleAlert },
  { title: "Staff", segment: "staff", icon: Users, adminOnly: true },
  { title: "Settings", segment: "settings", icon: Settings2 },
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

/* ── Search drawer ─────────────────────────────────────────────────────── */

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

  // Live search against RLS-protected tables from the browser client.
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      return;
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
            placeholder={`Search clients & vehicles…`}
            className="h-11 rounded-full pl-9"
          />
        </div>
        <button type="button" onClick={onClose} className="text-sm text-zinc-500">
          Cancel
        </button>
      </div>

      {/* Filter pills */}
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
          <p className="py-8 text-center text-sm text-zinc-500">
            Nothing matches “{query}”.
          </p>
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

/* ── Create drawer ─────────────────────────────────────────────────────── */

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

/* ── The pill itself ───────────────────────────────────────────────────── */

/**
 * Mobile-only floating pill nav (glassy, ClickUp-style): Home / Vehicles /
 * Rentals / Search / Profile, plus a separate “+” create button.
 */
export function MobileBottomNav({
  orgId,
  orgName,
  userName,
  userEmail,
  isAdmin,
  vehicleCount,
}: {
  orgId: string;
  orgName: string;
  userName: string;
  userEmail: string;
  isAdmin: boolean;
  vehicleCount: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const base = `/workspace/${orgId}`;

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

  return (
    <>
      {/* Floating pill + create button */}
      <nav className="fixed inset-x-0 bottom-4 z-40 flex items-center justify-center gap-2 md:hidden">
        <div className="flex items-center gap-1 rounded-full border border-black/10 bg-white/70 p-1.5 shadow-xl shadow-black/20 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/70">
          {PILL_ITEMS.map((item) => {
            const url = item.segment ? `${base}/${item.segment}` : base;
            const active = item.segment ? pathname.startsWith(url) : pathname === base;
            return (
              <Link
                key={item.title}
                href={url}
                aria-label={item.title}
                className={cn(
                  "relative flex size-11 items-center justify-center rounded-full transition-colors",
                  active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="mobile-pill-active"
                    className="absolute inset-0 rounded-full bg-black/10 dark:bg-white/15"
                    transition={{ type: "spring", stiffness: 450, damping: 34 }}
                  />
                )}
                <item.icon className="relative size-5" />
              </Link>
            );
          })}

          {/* Search */}
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
          >
            <Search className="size-5" />
          </button>

          {/* Profile */}
          <button
            type="button"
            aria-label="Profile"
            onClick={() => setProfileOpen(true)}
            className="flex size-11 items-center justify-center rounded-full"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
              {initials(userName)}
            </span>
          </button>
        </div>

        {/* “+” create — separate circle, like the reference */}
        <button
          type="button"
          aria-label="Create"
          onClick={() => setCreateOpen(true)}
          className="flex size-13 items-center justify-center rounded-full border border-black/10 bg-white/70 text-foreground shadow-xl shadow-black/20 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/70"
        >
          <Plus className="size-6" />
        </button>
      </nav>

      {/* Search drawer */}
      <SearchSheet orgId={orgId} open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Create drawer */}
      <CreateSheet
        orgId={orgId}
        isAdmin={isAdmin}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      {/* Profile & more — bottom drawer */}
      <SidePanel open={profileOpen} onClose={() => setProfileOpen(false)}>
        <div className="flex flex-col items-center gap-2 pt-2 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-zinc-200 text-xl font-bold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
            {initials(userName)}
          </span>
          <div>
            <p className="text-lg font-semibold">{userName}</p>
            <p className="text-xs text-zinc-500">{userEmail}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{isAdmin ? "Admin" : "Staff"}</Badge>
            <span className="text-xs text-zinc-500">{orgName}</span>
          </div>
          <p className="text-xs text-zinc-500">
            {vehicleCount} vehicle{vehicleCount === 1 ? "" : "s"} in the fleet
          </p>
        </div>

        <div className="flex flex-col divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {MORE_LINKS.filter((l) => isAdmin || !l.adminOnly).map((l) => (
            <Link
              key={l.segment}
              href={`${base}/${l.segment}`}
              onClick={() => setProfileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              <l.icon className="size-4 text-zinc-500" />
              <span className="flex-1">{l.title}</span>
              <ChevronRight className="size-4 text-zinc-400" />
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
        >
          {signingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
          Log out — end shift
        </button>
      </SidePanel>
    </>
  );
}
