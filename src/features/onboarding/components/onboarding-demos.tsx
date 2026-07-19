"use client";

import type { ReactNode } from "react";
import { Car, MapPin, Phone, Crown } from "lucide-react";

import { cn } from "@/lib/utils";
import { WorkspaceSwitcherDemo } from "./demoswitcher";

/* Small, non-interactive mockups that show what each onboarding step sets up.
   They live in the striped panel on the right of the desktop layout. */

const card = "w-64 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 shadow-xl backdrop-blur";

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

// Step 2 — location & contact
function LocationDemo() {
  return (
    <div className={card}>
      <div className="flex items-center gap-2.5">
        <span className="flex size-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
          <Car className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-zinc-100">Acme Rentals</p>
          <p className="text-xs text-zinc-500">Car hire business</p>
        </div>
      </div>
      <div className="mt-3 space-y-2 border-t border-zinc-800 pt-3">
        <div className="flex items-center gap-2 text-xs text-zinc-300">
          <MapPin className="size-3.5 text-zinc-500" /> Nairobi County
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-300">
          <Phone className="size-3.5 text-zinc-500" /> +254 712 345 678
        </div>
      </div>
    </div>
  );
}

// Step 3 — fleet: a short looping walkthrough video.
function FleetVideoDemo() {
  return (
    <div className="w-full overflow-hidden shadow-2xl">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        src="/fleetvid.mp4"
        autoPlay
        loop
        muted
        playsInline
        className="h-full w-full object-cover"
      />
    </div>
  );
}

// Step 4 — invite co-admins
function MembersDemo() {
  const members = [
    { name: "You", role: "Admin" as const },
    { name: "Amina Yusuf", role: "Admin" as const },
    { name: "Brian Otieno", role: "Staff" as const },
  ];
  return (
    <div className={card}>
      <p className="mb-3 text-sm font-semibold text-zinc-100">Team</p>
      <div className="space-y-2.5">
        {members.map((m) => (
          <div key={m.name} className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-bold text-zinc-300">
              {initials(m.name)}
            </span>
            <span className="flex-1 text-xs text-zinc-200">{m.name}</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                m.role === "Admin"
                  ? "bg-blue-500/15 text-blue-400"
                  : "bg-zinc-700/40 text-zinc-400"
              )}
            >
              {m.role}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Step 5 — plan
function PlanDemo() {
  const plans = [
    { name: "Free", price: "KES 0", popular: false },
    { name: "Pro", price: "KES 2,500", popular: true },
    { name: "Business", price: "KES 6,000", popular: false },
  ];
  return (
    <div className="w-64 space-y-2">
      {plans.map((p) => (
        <div
          key={p.name}
          className={cn(
            "flex items-center justify-between rounded-xl border p-3 shadow-lg backdrop-blur",
            p.popular
              ? "border-emerald-600 bg-emerald-600/10"
              : "border-zinc-800 bg-zinc-950/80"
          )}
        >
          <div className="flex items-center gap-2">
            {p.popular && <Crown className="size-3.5 text-emerald-400" />}
            <span className="text-sm font-medium text-zinc-100">{p.name}</span>
            {p.popular && (
              <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                Popular
              </span>
            )}
          </div>
          <span className="text-xs text-zinc-400">{p.price}</span>
        </div>
      ))}
    </div>
  );
}

/** Caption + demo shown in the right desktop panel for each step. */
export const STEP_PANELS: Record<number, { caption: string; demo: ReactNode }> = {
  1: { caption: "Create a business name for your workspace", demo: <WorkspaceSwitcherDemo /> },
  2: { caption: "Add where you operate and a contact line", demo: <LocationDemo /> },
  3: { caption: "See how you manage every vehicle", demo: <FleetVideoDemo /> },
  4: { caption: "Invite co-admins to help you run it", demo: <MembersDemo /> },
  5: { caption: "Pick a plan — start free, upgrade anytime", demo: <PlanDemo /> },
};
