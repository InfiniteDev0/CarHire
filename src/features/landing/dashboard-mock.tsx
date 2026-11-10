import {
  Calendar,
  Car,
  FileText,
  LayoutDashboard,
  TriangleAlert,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";

import { BrandMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/**
 * Static illustration of the workspace home screen for the landing page.
 * All figures are sample data — nothing here is read from a real workspace.
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

const STATS = [
  { label: "Available", value: "12", tone: "text-emerald-400", dot: "bg-emerald-400" },
  { label: "On rent", value: "7", tone: "text-primary", dot: "bg-primary" },
  { label: "In service", value: "2", tone: "text-amber-400", dot: "bg-amber-400" },
];

const BARS = [38, 52, 44, 66, 58, 81, 72, 94, 70, 88, 76, 100];

const RENTALS = [
  { plate: "KDG 214A", car: "Toyota Prado", client: "Amina W.", due: "Returns today", urgent: true },
  { plate: "KDK 908C", car: "Mazda CX-5", client: "Brian O.", due: "2 days left" },
  { plate: "KDM 377F", car: "Nissan X-Trail", client: "Halima A.", due: "5 days left" },
];

export function DashboardMock({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "overflow-hidden rounded-2xl border border-white/10 bg-[#0b0e11] text-[#f2f6f9] shadow-2xl shadow-primary/10",
        className,
      )}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="size-2.5 rounded-full bg-white/15" />
        <span className="ml-3 rounded-md bg-white/5 px-3 py-0.5 text-[10px] text-white/50">
          socdal · workspace
        </span>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="hidden w-40 shrink-0 flex-col gap-0.5 border-r border-white/10 bg-[#0f1317] p-2.5 sm:flex">
          <div className="mb-2 flex items-center gap-2 rounded-md bg-primary/10 p-2">
            <span className="flex size-6 items-center justify-center rounded bg-primary text-[#04121a]">
              <Car className="size-3.5" />
            </span>
            <span className="leading-tight">
              <span className="block text-[11px] font-medium">Savanna Rides</span>
              <span className="block text-[9px] text-white/50">Pro plan</span>
            </span>
          </div>
          {NAV.map((item) => (
            <div
              key={item.label}
              className={cn(
                "relative flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] text-white/55",
                item.active && "bg-primary/10 font-medium text-white",
              )}
            >
              {item.active && (
                <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" />
              )}
              <item.icon className="size-3.5" />
              {item.label}
            </div>
          ))}
          <div className="mt-auto flex items-center gap-1.5 px-2 pt-4 text-[9px] text-white/40">
            <BrandMark className="size-2.5" />
            Socdal by Nidaam Solutions
          </div>
        </div>

        {/* Main */}
        <div className="min-w-0 flex-1 space-y-3 p-3 sm:p-4">
          <div>
            <p className="text-sm font-semibold">Good morning, Yusuf</p>
            <p className="text-[10px] text-white/50">Here is how your fleet is doing today.</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {STATS.map((s) => (
              <div key={s.label} className="rounded-lg border border-white/10 bg-[#13181d] p-2.5">
                <p className="flex items-center gap-1.5 text-[10px] text-white/55">
                  <span className={cn("size-1.5 rounded-full", s.dot)} />
                  {s.label}
                </p>
                <p className={cn("mt-1 text-xl font-semibold tabular-nums", s.tone)}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-2 md:grid-cols-5">
            {/* Revenue */}
            <div className="rounded-lg border border-white/10 bg-[#13181d] p-3 md:col-span-3">
              <div className="flex items-baseline justify-between">
                <p className="text-[10px] text-white/55">Revenue this year</p>
                <p className="text-[10px] font-medium text-emerald-400">+18%</p>
              </div>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">$184,500</p>
              <div className="mt-3 flex h-20 items-end gap-1.5">
                {BARS.map((h, i) => (
                  <span
                    key={i}
                    style={{ height: `${h}%` }}
                    className={cn(
                      "flex-1 rounded-sm",
                      i === BARS.length - 1 ? "bg-primary" : "bg-primary/30",
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Ongoing rentals */}
            <div className="rounded-lg border border-white/10 bg-[#13181d] p-3 md:col-span-2">
              <p className="text-[10px] text-white/55">Ongoing rentals</p>
              <div className="mt-2 space-y-2">
                {RENTALS.map((r) => (
                  <div key={r.plate} className="flex items-center gap-2">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded bg-white/5">
                      <Car className="size-3 text-white/60" />
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-[10px] font-medium">
                        {r.car} · {r.plate}
                      </span>
                      <span className="block text-[9px] text-white/50">{r.client}</span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-medium",
                        r.urgent ? "bg-amber-400/15 text-amber-300" : "bg-primary/15 text-primary",
                      )}
                    >
                      {r.due}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
