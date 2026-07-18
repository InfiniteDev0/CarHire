"use client";

import { cn } from "@/lib/utils";

export interface FleetCar {
  id: string;
  reg_number: string;
  make: string | null;
  model: string | null;
  status: "AVAILABLE" | "TRIP" | "MAINTENANCE";
}

export interface FleetBooking {
  car_id: string;
  start: string; // ISO
  end: string; // ISO
  client: string;
  overdue: boolean;
}

const DAY = 86400_000;
const DAYS_SHOWN = 14;

const dayStart = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

/**
 * Day-grid of the next two weeks per car — eyeball capacity before promising
 * a car to a walk-in. Blue = booked, red = overdue, amber = in the workshop.
 */
export function FleetAvailability({
  cars,
  bookings,
}: {
  cars: FleetCar[];
  bookings: FleetBooking[];
}) {
  const today = dayStart(new Date());
  const days = Array.from({ length: DAYS_SHOWN }, (_, i) => new Date(today.getTime() + i * DAY));

  function cellFor(car: FleetCar, day: Date): { className: string; title: string } | null {
    const t = day.getTime();
    for (const b of bookings) {
      if (b.car_id !== car.id) continue;
      const from = dayStart(new Date(b.start)).getTime();
      // Overdue trips still block the car up to today even past expiration.
      const to = Math.max(dayStart(new Date(b.end)).getTime(), b.overdue ? today.getTime() : 0);
      if (t >= from && t <= to) {
        return b.overdue
          ? { className: "bg-red-500/80", title: `${b.client} — OVERDUE` }
          : { className: "bg-blue-500/70", title: `${b.client} — until ${new Date(b.end).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}` };
      }
    }
    if (car.status === "MAINTENANCE") {
      return { className: "bg-amber-400/60", title: "In the workshop" };
    }
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-140 border-collapse text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2 text-left font-medium backdrop-blur">
                Vehicle
              </th>
              {days.map((d) => {
                const isToday = d.getTime() === today.getTime();
                return (
                  <th
                    key={d.toISOString()}
                    className={cn(
                      "px-1 py-2 text-center font-medium tabular-nums",
                      isToday ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    <span className="block">
                      {d.toLocaleDateString("en-KE", { weekday: "narrow" })}
                    </span>
                    <span
                      className={cn(
                        isToday &&
                          "mx-auto flex size-5 items-center justify-center rounded-full bg-foreground text-background"
                      )}
                    >
                      {d.getDate()}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {cars.length === 0 ? (
              <tr>
                <td
                  colSpan={DAYS_SHOWN + 1}
                  className="h-24 text-center text-muted-foreground"
                >
                  No vehicles in the fleet yet.
                </td>
              </tr>
            ) : (
              cars.map((car) => (
                <tr key={car.id} className="border-t">
                  <td className="sticky left-0 z-10 bg-background px-3 py-2">
                    <p className="font-medium">{car.reg_number}</p>
                    <p className="text-muted-foreground">
                      {[car.make, car.model].filter(Boolean).join(" ")}
                    </p>
                  </td>
                  {days.map((d) => {
                    const cell = cellFor(car, d);
                    return (
                      <td key={d.toISOString()} className="p-0.5">
                        <div
                          title={cell?.title}
                          className={cn(
                            "h-7 rounded-sm",
                            cell ? cell.className : "bg-green-500/50"
                          )}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-green-500/80 ring-1 ring-border" /> Free
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-blue-500/70" /> On rent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-red-500/80" /> Overdue
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-amber-400/60" /> Maintenance
        </span>
      </div>
    </div>
  );
}
