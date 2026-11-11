import {
  Bell,
  Calendar,
  Car,
  ChevronsUpDown,
  CircleCheck,
  FileText,
  HandCoins,
  KeyRound,
  LayoutDashboard,
  Search,
  TriangleAlert,
  UserRound,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Static illustration of the workspace for the landing page: top bar, black
 * nav card and the canvas panel with stat cards. Follows the active theme.
 * All figures are sample data — nothing is read from a real workspace.
 */

const NAV = [
  { label: "Home", icon: LayoutDashboard, active: true },
  { label: "Vehicles", icon: Car },
  { label: "Rentals", icon: FileText },
  { label: "Clients", icon: UserRound },
  { label: "Staff", icon: Users },
  { label: "Finance", icon: Wallet },
  { label: "Complaints", icon: TriangleAlert },
  { label: "Calendar", icon: Calendar },
];

export const TONES = {
  neutral: { badge: "border border-border text-foreground", value: "text-foreground" },
  green: {
    badge: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
    value: "text-green-600 dark:text-green-400",
  },
  blue: {
    badge: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    value: "text-blue-600 dark:text-blue-400",
  },
  orange: {
    badge: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    value: "text-orange-600 dark:text-orange-400",
  },
  violet: {
    badge: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    value: "text-violet-600 dark:text-violet-400",
  },
  red: {
    badge: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
    value: "text-red-600 dark:text-red-400",
  },
} as const;

const STATS = [
  { tone: "neutral", icon: Car, label: "Vehicles", value: "21", caption: "Total fleet · 2 new this month" },
  { tone: "green", icon: CircleCheck, label: "Available", value: "12", caption: "Ready to rent out" },
  { tone: "blue", icon: KeyRound, label: "On rent", value: "7", caption: "3 return today" },
  { tone: "orange", icon: Wrench, label: "In service", value: "2", caption: "Back on Thursday" },
] as const;

const TODO = [
  { name: "Amina Wanjiru", line: "Toyota Prado · KDG 214A · returns today", amount: "$120", late: false },
  { name: "Brian Otieno", line: "Mazda CX-5 · KDK 908C · 2 days overdue", amount: "$340", late: true },
  { name: "Halima Abdi", line: "Nissan X-Trail · KDM 377F · deposit pending", amount: "$200", late: false },
];

export function DashboardMock({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "overflow-hidden rounded-2xl bg-background text-foreground shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)] ring-1 ring-foreground/10",
        className,
      )}
    >
      {/* Top bar */}
      <div className="flex h-11 items-center justify-between gap-3 px-2.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 items-center gap-1.5 rounded-lg bg-black/5 pl-1 pr-1.5 dark:bg-white/10">
            <span className="flex size-5 items-center justify-center rounded-md bg-blue-500 text-[10px] font-semibold text-white">
              S
            </span>
            <span className="text-xs font-semibold">Savanna Rides</span>
            <ChevronsUpDown className="size-3 text-muted-foreground" />
          </span>
          <span className="hidden text-xs font-semibold sm:block">Home</span>
        </div>
        <span className="hidden h-7 w-56 items-center gap-2 rounded-lg bg-card px-2.5 text-[11px] text-muted-foreground md:flex">
          <Search className="size-3" />
          Search vehicles, clients, rentals
        </span>
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <span className="text-xs font-medium tabular-nums text-foreground">9:41 AM</span>
          <Bell className="size-3.5" />
          <span className="flex size-6 items-center justify-center rounded-full bg-vivid-cyan/10 text-[9px] font-semibold text-vivid-cyan">
            YM
          </span>
        </div>
      </div>

      <div className="flex gap-2 px-2 pb-2">
        {/* Black nav card */}
        <div className="hidden w-40 shrink-0 flex-col gap-0.5 rounded-lg bg-black p-1.5 text-white sm:flex">
          {NAV.map((item) => (
            <div
              key={item.label}
              className={cn(
                "flex h-8 items-center gap-2.5 rounded-md px-2.5 text-xs text-white/70",
                item.active && "bg-white/20 font-medium text-white",
              )}
            >
              <item.icon
                className="size-3.5"
                stroke={item.active ? "url(#mock-nav-active)" : "rgb(255 255 255 / 0.5)"}
              />
              {item.label}
            </div>
          ))}
          <svg width="0" height="0" className="absolute">
            <defs>
              <linearGradient id="mock-nav-active" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0" stopColor="#ffd600" />
                <stop offset="1" stopColor="#00d078" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Canvas panel */}
        <div className="min-w-0 flex-1 space-y-3 rounded-lg border bg-canvas p-3 sm:p-4">
          <div className="text-left">
            <span className="block text-lg font-semibold tracking-tight">Good morning, Yusuf</span>
            <span className="block text-xs text-muted-foreground">Tuesday · 3 cars return today</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="flex h-24 flex-col justify-between rounded-xl bg-card p-2.5 text-left">
                <span
                  className={cn(
                    "inline-flex h-6 w-fit items-center gap-1.5 rounded-full px-2 text-[11px] font-medium",
                    TONES[s.tone].badge,
                  )}
                >
                  <s.icon className="size-3" />
                  {s.label}
                </span>
                <span>
                  <span className={cn("block text-2xl font-semibold leading-none tabular-nums", TONES[s.tone].value)}>
                    {s.value}
                  </span>
                  <span className="mt-1 block truncate text-[10px] text-muted-foreground">{s.caption}</span>
                </span>
              </div>
            ))}
          </div>

          {/* What needs doing */}
          <div className="rounded-xl bg-card text-left">
            <div className="flex items-center gap-4 border-b px-4 pt-3">
              <span className="pb-2.5 text-sm font-semibold">What needs doing</span>
              <span className="-mb-px ml-auto flex items-center gap-1.5 border-b-2 border-primary pb-2.5 text-xs font-semibold">
                To collect
                <span className="flex size-4 items-center justify-center rounded-full bg-primary text-[9px] text-primary-foreground">
                  3
                </span>
              </span>
              <span className="pb-2.5 text-xs text-muted-foreground">Returns</span>
            </div>
            <div className="divide-y">
              {TODO.map((t) => (
                <div key={t.name} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-xs font-semibold">
                      {t.name}
                      {t.late && (
                        <span className="rounded-md bg-red-50 px-1.5 text-[10px] font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
                          Late
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">{t.line}</span>
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-green-600 dark:text-green-400">
                    {t.amount}
                  </span>
                  <span className="hidden h-7 items-center gap-1 rounded-md bg-green-100 px-2.5 text-[11px] font-bold text-green-700 dark:bg-green-500/15 dark:text-green-300 md:flex">
                    <HandCoins className="size-3" />
                    Collect
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
