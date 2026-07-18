"use client";

import { useState } from "react";
import { MoonStar } from "lucide-react";

import { cn } from "@/lib/utils";
import { RentalCalendar, type CalendarEvent } from "./rental-calendar";
import { FleetAvailability, type FleetCar, type FleetBooking } from "./fleet-availability";

const TABS = [
  { id: "schedule", label: "Schedule" },
  { id: "fleet", label: "Fleet availability" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export function CalendarView({
  orgId,
  events,
  cars,
  bookings,
  curfew,
}: {
  orgId: string;
  events: CalendarEvent[];
  cars: FleetCar[];
  bookings: FleetBooking[];
  curfew: string | null;
}) {
  const [tab, setTab] = useState<TabId>("schedule");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* View pills */}
        <div className="flex gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                tab === t.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-input text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Curfew blackout notice */}
        {curfew && (
          <span className="ml-auto flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
            <MoonStar className="size-3.5" />
            Checkout curfew {curfew} — no dispatches during these hours
          </span>
        )}
      </div>

      {tab === "schedule" ? (
        <RentalCalendar orgId={orgId} events={events} />
      ) : (
        <FleetAvailability cars={cars} bookings={bookings} />
      )}
    </div>
  );
}
