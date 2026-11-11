"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Car, CornerDownLeft, FileText, Plus, Search, TriangleAlert, UserPlus, UserRound } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WORKSPACE_NAV_ITEMS, navItemUrl } from "./nav-items";

interface Result {
  key: string;
  title: string;
  detail: string;
  href: string;
  icon: typeof Car;
  group: "Go to" | "Create" | "Clients" | "Vehicles";
}

function createActions(base: string, isAdmin: boolean) {
  return [
    { title: "New rental", detail: "Client, car and deposit together", href: `${base}/rentals?new=1`, icon: FileText },
    { title: "Add client", detail: "Someone new, before they rent", href: `${base}/clients?new=1`, icon: UserPlus },
    ...(isAdmin
      ? [{ title: "Add vehicle", detail: "Put a car in the fleet", href: `${base}/vehicles?new=1`, icon: Car }]
      : []),
    { title: "File complaint", detail: "Log an incident on a rental or car", href: `${base}/complaints?new=1`, icon: TriangleAlert },
  ];
}

/** Round "+" in the top bar: the quick-create menu. */
export function QuickCreate({ orgId, isAdmin }: { orgId: string; isAdmin: boolean }) {
  const router = useRouter();
  const actions = createActions(`/workspace/${orgId}`, isAdmin);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Create"
            title="Create"
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Plus className="size-[18px]" />
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-64">
        {actions.map((a) => (
          <DropdownMenuItem key={a.href} onClick={() => router.push(a.href)} className="gap-3 py-2">
            <a.icon className="size-4 text-muted-foreground" />
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-medium">{a.title}</span>
              <span className="text-xs text-muted-foreground">{a.detail}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Top-bar search box. Opens a command palette; also Ctrl/⌘ K. */
export function CommandSearch({ orgId, isAdmin }: { orgId: string; isAdmin: boolean }) {
  const router = useRouter();
  const base = `/workspace/${orgId}`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<Result[]>([]);
  const [cursor, setCursor] = useState(0);

  // Ctrl/⌘ K toggles the palette from anywhere.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Look up clients and vehicles as the user types.
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    const t = setTimeout(async () => {
      if (q.length < 2) {
        setRecords([]);
        return;
      }
      const supabase = createClient();
      const like = `%${q}%`;
      const [clientsRes, carsRes] = await Promise.all([
        supabase
          .from("clients")
          .select("id, full_name, phone, national_id")
          .eq("org_id", orgId)
          .or(`full_name.ilike.${like},phone.ilike.${like},national_id.ilike.${like}`)
          .limit(5),
        supabase
          .from("cars")
          .select("id, reg_number, make, model")
          .eq("org_id", orgId)
          .is("decommissioned_at", null)
          .or(`reg_number.ilike.${like},make.ilike.${like},model.ilike.${like}`)
          .limit(5),
      ]);
      setRecords([
        ...(clientsRes.data ?? []).map((c) => ({
          key: `client-${c.id}`,
          title: c.full_name as string,
          detail: [c.phone, c.national_id].filter(Boolean).join(" · "),
          href: `${base}/clients`,
          icon: UserRound,
          group: "Clients" as const,
        })),
        ...(carsRes.data ?? []).map((c) => ({
          key: `car-${c.id}`,
          title: c.reg_number as string,
          detail: [c.make, c.model].filter(Boolean).join(" "),
          href: `${base}/vehicles/${c.id}`,
          icon: Car,
          group: "Vehicles" as const,
        })),
      ]);
    }, q.length < 2 ? 0 : 220);
    return () => clearTimeout(t);
  }, [query, open, orgId, base]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pages: Result[] = WORKSPACE_NAV_ITEMS.filter((i) => isAdmin || i.segment !== "staff").map((i) => ({
      key: `page-${i.title}`,
      title: i.title,
      detail: "Page",
      href: navItemUrl(base, i),
      icon: i.icon,
      group: "Go to",
    }));
    const create: Result[] = createActions(base, isAdmin).map((a) => ({
      key: `create-${a.title}`,
      title: a.title,
      detail: a.detail,
      href: a.href,
      icon: a.icon,
      group: "Create",
    }));
    const match = (r: Result) => !q || r.title.toLowerCase().includes(q);
    return [...records, ...pages.filter(match), ...create.filter(match)];
  }, [query, records, base, isAdmin]);

  function close() {
    setOpen(false);
    setQuery("");
    setRecords([]);
    setCursor(0);
  }
  function go(r: Result) {
    close();
    router.push(r.href);
  }
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter" && results[cursor]) {
      e.preventDefault();
      go(results[cursor]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden h-8 w-[22rem] items-center gap-2 rounded-lg bg-card px-3 text-sm text-muted-foreground transition-colors hover:text-foreground lg:flex"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Search clients, vehicles, pages</span>
        <kbd className="rounded-[4px] bg-muted px-1.5 text-[11px] font-medium">Ctrl K</kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
      >
        <Search className="size-[18px]" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[14vh]">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-xs" onClick={close} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className="relative w-full max-w-xl overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-2xl ring-1 ring-foreground/10 animate-in fade-in-0 zoom-in-95 duration-100"
          >
            <div className="flex items-center gap-3 border-b px-4">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCursor(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Search clients, vehicles or pages"
                className="h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="scrollbar-pill max-h-[50vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Nothing matches. Try another word.
                </p>
              ) : (
                results.map((r, i) => (
                  <div key={r.key}>
                    {(i === 0 || results[i - 1].group !== r.group) && (
                      <div className="px-3 pb-1 pt-2 text-xs font-medium text-muted-foreground">{r.group}</div>
                    )}
                    <button
                      type="button"
                      onClick={() => go(r)}
                      onMouseEnter={() => setCursor(i)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left",
                        i === cursor && "bg-muted",
                      )}
                    >
                      <r.icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{r.title}</span>
                        {r.detail && (
                          <span className="block truncate text-xs text-muted-foreground">{r.detail}</span>
                        )}
                      </span>
                      {i === cursor && <CornerDownLeft className="size-3.5 text-muted-foreground" />}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
