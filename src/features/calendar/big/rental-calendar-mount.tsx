"use client";

import { CalendarProvider } from "@cal/calendar/contexts/calendar-context";
import { ClientContainer } from "@cal/calendar/components/client-container";
import type { IEvent, IUser } from "@cal/calendar/interfaces";
import type { TBadgeVariant, TWorkingHours } from "@cal/calendar/types";

export interface CalendarSettings {
  badgeVariant: TBadgeVariant;
  visibleStart: number;
  visibleEnd: number;
  workingHours: TWorkingHours;
}

/** Mounts the big-calendar with real rental data (events) + clients (users). */
export function RentalCalendarMount({
  orgId,
  events,
  users,
  settings,
}: {
  orgId: string;
  events: IEvent[];
  users: IUser[];
  settings: CalendarSettings;
}) {
  return (
    <CalendarProvider
      orgId={orgId}
      users={users}
      events={events}
      initialView="month"
      initialBadge={settings.badgeVariant}
      initialVisible={{ from: settings.visibleStart, to: settings.visibleEnd }}
      initialWorking={settings.workingHours}
    >
      <ClientContainer />
    </CalendarProvider>
  );
}
