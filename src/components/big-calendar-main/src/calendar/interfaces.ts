import type { TEventColor } from "@cal/calendar/types";

export interface IUser {
  id: string;
  name: string;
  picturePath: string | null;
}

export interface IEvent {
  id: number;
  startDate: string;
  endDate: string;
  title: string;
  color: TEventColor;
  description: string;
  user: IUser;
  // Car-hire extensions (optional so the base calendar keeps working):
  kind?: "RENTAL" | "REMINDER" | "PAYMENT";
  contractId?: string;
  reminderId?: string;
  note?: string;
  resolved?: boolean;
  href?: string;
}

export interface ICalendarCell {
  day: number;
  currentMonth: boolean;
  date: Date;
}
