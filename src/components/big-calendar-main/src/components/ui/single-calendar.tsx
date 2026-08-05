"use client";

import * as React from "react";

import { Calendar } from "@/components/ui/calendar";

// Use the app's polished calendar for the mini date-pickers.
export type SingleCalendarProps = React.ComponentProps<typeof Calendar>;

function SingleCalendar(props: SingleCalendarProps) {
  return <Calendar {...props} />;
}
SingleCalendar.displayName = "Calendar";

export { SingleCalendar };
