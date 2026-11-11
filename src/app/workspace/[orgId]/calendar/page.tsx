import { createClient } from "@/lib/supabase/server";
import {
  RentalCalendarMount,
  type CalendarSettings,
} from "@/features/calendar/big/rental-calendar-mount";
import type { IEvent, IUser } from "@cal/calendar/interfaces";
import type { TBadgeVariant, TEventColor, TWorkingHours } from "@cal/calendar/types";
import { money } from "@/lib/money";

const DEFAULT_WORKING: TWorkingHours = {
  0: { from: 0, to: 0 },
  1: { from: 9, to: 17 },
  2: { from: 9, to: 17 },
  3: { from: 9, to: 17 },
  4: { from: 9, to: 17 },
  5: { from: 9, to: 17 },
  6: { from: 9, to: 13 },
};

export const metadata = { title: "Calendar · Socdal" };

interface CalContract {
  id: string;
  status: string;
  created_at: string;
  client_id: string;
  contract_start: string | null;
  contract_expiration: string | null;
  total_amount: number | null;
  amount_paid: number | null;
  refuel_penalty: number | null;
  clients: { full_name: string } | null;
  cars: { reg_number: string } | null;
}

interface CalReminder {
  id: string;
  title: string;
  note: string | null;
  remind_at: string;
  color: string | null;
  resolved: boolean;
}

const REMINDER_USER = "reminders";

function colorFor(status: string, overdue: boolean): TEventColor {
  if (overdue) return "red";
  switch (status) {
    case "ACTIVE":
      return "blue";
    case "EXTENDED":
      return "purple";
    case "COMPLETED":
      return "green";
    case "CANCELLED":
      return "gray";
    default:
      return "orange"; // DRAFT
  }
}

// Module-level so the impure Date.now() stays out of render (React Compiler).
function buildEvents(rows: CalContract[], reminders: CalReminder[]): IEvent[] {
  const now = Date.now();
  const out: IEvent[] = [];
  let id = 1;

  for (const c of rows) {
    const start = c.contract_start ?? c.created_at;
    const end = c.contract_expiration ?? c.contract_start ?? c.created_at;
    const overdue =
      c.status === "ACTIVE" && !!c.contract_expiration && new Date(c.contract_expiration).getTime() < now;
    const carLabel = c.cars?.reg_number ?? "Vehicle";
    const clientLabel = c.clients?.full_name ?? "Client";
    const balance = (c.total_amount ?? 0) + (c.refuel_penalty ?? 0) - (c.amount_paid ?? 0);
    const clientUser: IUser = { id: c.client_id, name: clientLabel, picturePath: null };

    // The rental span (checkout → return).
    out.push({
      id: id++,
      startDate: new Date(start).toISOString(),
      endDate: new Date(end).toISOString(),
      title: `${carLabel} · ${clientLabel}`,
      color: colorFor(c.status, overdue),
      description: [
        overdue ? "OVERDUE" : c.status,
        c.total_amount != null ? `Total ${money(c.total_amount)}` : null,
        balance > 0 ? `Balance ${money(balance)}` : "Fully paid",
      ]
        .filter(Boolean)
        .join(" · "),
      user: clientUser,
      kind: "RENTAL",
      contractId: c.id,
      href: `/workspace/rentals`,
    });

    // Payment due — remaining balance on an active/overdue rental, marked on the return date.
    if (balance > 0 && (c.status === "ACTIVE" || c.status === "EXTENDED") && c.contract_expiration) {
      out.push({
        id: id++,
        startDate: new Date(c.contract_expiration).toISOString(),
        endDate: new Date(c.contract_expiration).toISOString(),
        title: `Payment due · ${clientLabel}`,
        color: "yellow",
        description: `${money(balance)} outstanding on ${carLabel}`,
        user: clientUser,
        kind: "PAYMENT",
        contractId: c.id,
      });
    }
  }

  for (const r of reminders) {
    out.push({
      id: id++,
      startDate: new Date(r.remind_at).toISOString(),
      endDate: new Date(r.remind_at).toISOString(),
      title: r.resolved ? `✓ ${r.title}` : r.title,
      color: (r.color as TEventColor) || "yellow",
      description: r.note ?? "",
      user: { id: REMINDER_USER, name: "Reminders", picturePath: null },
      kind: "REMINDER",
      reminderId: r.id,
      note: r.note ?? undefined,
      resolved: r.resolved,
    });
  }

  return out;
}

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();

  const [{ data: contracts }, { data: reminders }, { data: org }] = await Promise.all([
    supabase
      .from("contracts")
      .select(
        "id, status, created_at, client_id, contract_start, contract_expiration, total_amount, amount_paid, refuel_penalty, clients(full_name), cars(reg_number)"
      )
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),
    supabase
      .from("calendar_reminders")
      .select("id, title, note, remind_at, color, resolved")
      .eq("org_id", orgId)
      .order("remind_at", { ascending: false }),
    supabase
      .from("organizations")
      .select("cal_badge_variant, cal_visible_start, cal_visible_end, cal_working_hours")
      .eq("id", orgId)
      .maybeSingle(),
  ]);

  const settings: CalendarSettings = {
    badgeVariant: (org?.cal_badge_variant as TBadgeVariant) ?? "colored",
    visibleStart: org?.cal_visible_start ?? 7,
    visibleEnd: org?.cal_visible_end ?? 18,
    workingHours: (org?.cal_working_hours as TWorkingHours) ?? DEFAULT_WORKING,
  };

  const rows = (contracts ?? []) as unknown as CalContract[];
  const events = buildEvents(rows, (reminders ?? []) as CalReminder[]).map((e) => ({
    ...e,
    href: e.kind === "RENTAL" ? `/workspace/${orgId}/rentals` : e.href,
  }));

  // The filter dropdown = clients (+ a Reminders bucket).
  const seen = new Map<string, IUser>();
  for (const e of events) {
    if (!seen.has(e.user.id)) seen.set(e.user.id, e.user);
  }
  const users: IUser[] = [...seen.values()];

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Calendar</h1>
        <p className="hidden max-w-3xl text-sm text-muted-foreground md:block">
          Every rental, payment due and reminder across your fleet.
        </p>
      </div>

      <RentalCalendarMount orgId={orgId} events={events} users={users} settings={settings} />
    </div>
  );
}
