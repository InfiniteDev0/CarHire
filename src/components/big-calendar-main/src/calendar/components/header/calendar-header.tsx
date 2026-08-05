import { Columns, Grid3x3, List, Plus, Grid2x2, CalendarRange } from "lucide-react";

import { Button } from "@cal/components/ui/button";
import { cn } from "@cal/lib/utils";

import { useCalendar } from "@cal/calendar/contexts/calendar-context";
import { UserSelect } from "@cal/calendar/components/header/user-select";
import { TodayButton } from "@cal/calendar/components/header/today-button";
import { DateNavigator } from "@cal/calendar/components/header/date-navigator";
import { AddEventDialog } from "@cal/calendar/components/dialogs/add-event-dialog";

import type { IEvent } from "@cal/calendar/interfaces";
import type { TCalendarView } from "@cal/calendar/types";

interface IProps {
  view: TCalendarView;
  events: IEvent[];
}

const VIEW_BUTTONS: { view: TCalendarView; label: string; icon: typeof List }[] = [
  { view: "day", label: "View by day", icon: List },
  { view: "week", label: "View by week", icon: Columns },
  { view: "month", label: "View by month", icon: Grid2x2 },
  { view: "year", label: "View by year", icon: Grid3x3 },
  { view: "agenda", label: "View by agenda", icon: CalendarRange },
];

export function CalendarHeader({ view, events }: IProps) {
  const { setView } = useCalendar();
  return (
    <div className="flex flex-col gap-4 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <TodayButton />
        <DateNavigator view={view} events={events} />
      </div>

      <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between">
        <div className="flex w-full items-center gap-1.5">
          <div className="inline-flex">
            {VIEW_BUTTONS.map((b, i) => (
              <Button
                key={b.view}
                type="button"
                aria-label={b.label}
                size="icon"
                variant={view === b.view ? "default" : "outline"}
                onClick={() => setView(b.view)}
                className={cn(
                  "-ml-px [&_svg]:size-5",
                  i === 0 && "ml-0 rounded-r-none",
                  i === VIEW_BUTTONS.length - 1 && "rounded-l-none",
                  i !== 0 && i !== VIEW_BUTTONS.length - 1 && "rounded-none"
                )}
              >
                <b.icon strokeWidth={1.8} />
              </Button>
            ))}
          </div>

          <UserSelect />
        </div>

        <AddEventDialog>
          <Button className="w-full sm:w-auto">
            <Plus />
            Add Event
          </Button>
        </AddEventDialog>
      </div>
    </div>
  );
}
