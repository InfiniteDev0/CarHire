"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type CalendarEventKind = "START" | "RETURN" | "OVERDUE";

export interface CalendarEvent {
  id: string; // unique per chip, e.g. `${contractId}-START`
  contractId: string;
  date: string; // "YYYY-MM-DD" local
  kind: CalendarEventKind;
  regNumber: string;
  clientName: string;
}

const KIND_LABEL: Record<CalendarEventKind, string> = {
  START: "Checkout",
  RETURN: "Return due",
  OVERDUE: "Overdue",
};

const KIND_CHIP: Record<CalendarEventKind, string> = {
  START: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  RETURN: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  OVERDUE: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function RentalCalendar({
  orgId,
  events,
}: {
  orgId: string;
  events: CalendarEvent[];
}) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  const [selected, setSelected] = useState<string>(toKey(now));

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [events]);

  // Weeks covering the displayed month, Monday-first.
  const weeks = useMemo(() => {
    const first = new Date(year, month, 1);
    const start = new Date(first);
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    const out: Date[][] = [];
    const cur = new Date(start);
    do {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }
      out.push(week);
    } while (cur.getMonth() === month);
    return out;
  }, [year, month]);

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  const todayKey = toKey(now);
  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-KE", {
    month: "long",
    year: "numeric",
  });
  const selectedEvents = byDay.get(selected) ?? [];
  const selectedLabel = new Date(`${selected}T00:00:00`).toLocaleDateString("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      {/* Month grid */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium">{monthLabel}</h2>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="outline" className="size-7 p-0" onClick={() => shiftMonth(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              className="h-7 rounded-sm px-2 text-xs"
              onClick={() => {
                setYear(now.getFullYear());
                setMonth(now.getMonth());
                setSelected(todayKey);
              }}
            >
              Today
            </Button>
            <Button variant="outline" className="size-7 p-0" onClick={() => shiftMonth(1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border">
          <div className="grid grid-cols-7 border-b bg-muted/50">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                {d}
              </div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b last:border-b-0">
              {week.map((day) => {
                const key = toKey(day);
                const dayEvents = byDay.get(key) ?? [];
                const inMonth = day.getMonth() === month;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelected(key)}
                    className={cn(
                      "flex min-h-20 flex-col items-stretch gap-1 border-r p-1.5 text-left transition-colors last:border-r-0 hover:bg-muted/50",
                      !inMonth && "bg-muted/30 text-muted-foreground",
                      selected === key && "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "self-start text-xs tabular-nums",
                        key === todayKey &&
                          "flex size-5 items-center justify-center rounded-full bg-foreground font-medium text-background"
                      )}
                    >
                      {day.getDate()}
                    </span>
                    {dayEvents.slice(0, 2).map((e) => (
                      <span
                        key={e.id}
                        className={cn(
                          "truncate rounded px-1 py-0.5 text-[10px] leading-tight",
                          KIND_CHIP[e.kind]
                        )}
                      >
                        {e.regNumber}
                      </span>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(KIND_LABEL) as CalendarEventKind[]).map((k) => (
            <Badge key={k} className={KIND_CHIP[k]}>
              {KIND_LABEL[k]}
            </Badge>
          ))}
        </div>
      </div>

      {/* Day detail */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">{selectedLabel}</h2>
        {selectedEvents.length === 0 ? (
          <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center">
            <CalendarDays className="size-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Nothing scheduled this day.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {selectedEvents.map((e) => (
              <Link
                key={e.id}
                href={`/workspace/${orgId}/rentals`}
                className="flex flex-col gap-1 rounded-lg border bg-card p-2.5 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <Badge className={KIND_CHIP[e.kind]}>{KIND_LABEL[e.kind]}</Badge>
                  <span className="text-sm font-medium">{e.regNumber}</span>
                </div>
                <span className="text-xs text-muted-foreground">{e.clientName}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
