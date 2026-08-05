"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info, Moon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@cal/components/ui/button";
import { Switch } from "@cal/components/ui/switch";
import { TimeInput } from "@cal/components/ui/time-input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@cal/components/ui/tooltip";

import type { TimeValue } from "react-aria-components";
import { updateCalendarWorkingHours, type WorkingHours } from "../actions";

const DAYS_OF_WEEK = [
  { index: 0, name: "Sunday" },
  { index: 1, name: "Monday" },
  { index: 2, name: "Tuesday" },
  { index: 3, name: "Wednesday" },
  { index: 4, name: "Thursday" },
  { index: 5, name: "Friday" },
  { index: 6, name: "Saturday" },
];

/** The calendar's per-day working-hours editor, persisted per workspace (admin). */
export function CalendarWorkingHoursForm({
  orgId,
  initial,
}: {
  orgId: string;
  initial: WorkingHours;
}) {
  const router = useRouter();
  const [hours, setHours] = useState<WorkingHours>(initial);
  const [saving, setSaving] = useState(false);

  const toggleDay = (dayId: number) => {
    setHours((prev) => ({
      ...prev,
      [dayId]: prev[dayId].from > 0 || prev[dayId].to > 0 ? { from: 0, to: 0 } : { from: 9, to: 17 },
    }));
  };

  const changeTime = (dayId: number, type: "from" | "to", value: TimeValue | null) => {
    if (!value) return;
    setHours((prev) => {
      const updated = { ...prev[dayId], [type]: value.hour };
      if (type === "to" && value.hour === 0 && updated.from === 0) updated.to = 24;
      return { ...prev, [dayId]: updated };
    });
  };

  async function apply() {
    if (saving) return;
    setSaving(true);
    try {
      // Normalise closed/open days the same way the calendar does.
      const out: WorkingHours = {};
      for (const { index } of DAYS_OF_WEEK) {
        const day = hours[index];
        const active = day.from > 0 || day.to > 0;
        if (!active) out[index] = { from: 0, to: 0 };
        else if (day.from === 0 && day.to === 0) out[index] = { from: 0, to: 24 };
        else if (day.to === 0 && day.from > 0) out[index] = { ...day, to: 24 };
        else out[index] = day;
      }
      await updateCalendarWorkingHours(orgId, out);
      toast.success("Working hours saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold">Change working hours</p>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger>
              <Info className="size-3" />
            </TooltipTrigger>
            <TooltipContent className="max-w-80 text-center">
              <p>Hours outside this window get a dashed background on the week and day views.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="space-y-4">
        {DAYS_OF_WEEK.map((day) => {
          const active = hours[day.index].from > 0 || hours[day.index].to > 0;
          return (
            <div key={day.index} className="flex items-center gap-4">
              <div className="flex w-40 items-center gap-2">
                <Switch checked={active} onCheckedChange={() => toggleDay(day.index)} />
                <span className="text-sm font-medium">{day.name}</span>
              </div>

              {active ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span>From</span>
                    <TimeInput
                      id={`${day.name.toLowerCase()}-from`}
                      hourCycle={12}
                      granularity="hour"
                      value={{ hour: hours[day.index].from, minute: 0 } as TimeValue}
                      onChange={(value) => changeTime(day.index, "from", value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span>To</span>
                    <TimeInput
                      id={`${day.name.toLowerCase()}-to`}
                      hourCycle={12}
                      granularity="hour"
                      value={{ hour: hours[day.index].to, minute: 0 } as TimeValue}
                      onChange={(value) => changeTime(day.index, "to", value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Moon className="size-4" />
                  <span>Closed</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button className="mt-4 w-fit" onClick={apply} disabled={saving}>
        {saving && <Loader2 className="mr-1 size-4 animate-spin" />}
        Apply
      </Button>
    </div>
  );
}
