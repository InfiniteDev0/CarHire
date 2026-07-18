import { createClient } from "@/lib/supabase/server";
import { CalendarView } from "@/features/calendar/components/calendar-view";
import type { CalendarEvent } from "@/features/calendar/components/rental-calendar";
import type {
  FleetCar,
  FleetBooking,
} from "@/features/calendar/components/fleet-availability";

export const metadata = { title: "Calendar · CarHire" };

interface CalContract {
  id: string;
  status: string;
  car_id: string;
  contract_start: string | null;
  contract_expiration: string | null;
  clients: { full_name: string } | null;
  cars: { reg_number: string } | null;
}

const toKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// Module-level (not render) so the impure Date.now() stays out of the component.
function buildCalendarData(rows: CalContract[]): {
  events: CalendarEvent[];
  bookings: FleetBooking[];
} {
  const now = Date.now();

  const events: CalendarEvent[] = [];
  for (const c of rows) {
    const base = {
      contractId: c.id,
      regNumber: c.cars?.reg_number ?? "—",
      clientName: c.clients?.full_name ?? "—",
    };
    if (c.contract_start) {
      events.push({ ...base, id: `${c.id}-START`, date: toKey(c.contract_start), kind: "START" });
    }
    if (c.contract_expiration) {
      const overdue = c.status === "ACTIVE" && new Date(c.contract_expiration).getTime() < now;
      events.push({
        ...base,
        id: `${c.id}-RETURN`,
        date: toKey(c.contract_expiration),
        kind: overdue ? "OVERDUE" : "RETURN",
      });
    }
  }

  const bookings: FleetBooking[] = rows
    .filter((c) => c.status === "ACTIVE" && c.contract_start && c.contract_expiration)
    .map((c) => ({
      car_id: c.car_id,
      start: c.contract_start!,
      end: c.contract_expiration!,
      client: c.clients?.full_name ?? "Client",
      overdue: new Date(c.contract_expiration!).getTime() < now,
    }));

  return { events, bookings };
}

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();

  const [{ data: contracts }, { data: cars }, { data: org }] = await Promise.all([
    supabase
      .from("contracts")
      .select(
        "id, status, car_id, contract_start, contract_expiration, clients(full_name), cars(reg_number)"
      )
      .eq("org_id", orgId)
      .in("status", ["ACTIVE", "COMPLETED"])
      .not("contract_start", "is", null),
    supabase
      .from("cars")
      .select("id, reg_number, make, model, status")
      .eq("org_id", orgId)
      .is("decommissioned_at", null)
      .order("reg_number"),
    supabase
      .from("organizations")
      .select("curfew_start, curfew_end")
      .eq("id", orgId)
      .maybeSingle(),
  ]);

  const rows = (contracts ?? []) as unknown as CalContract[];
  const { events, bookings } = buildCalendarData(rows);

  const t = (v: string | null | undefined) => (v ? String(v).slice(0, 5) : null);
  const curfew =
    org?.curfew_start && org?.curfew_end
      ? `${t(org.curfew_start)} – ${t(org.curfew_end)}`
      : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-xl">Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Checkouts, returns and per-car availability at a glance.
        </p>
      </div>

      <CalendarView
        orgId={orgId}
        events={events}
        cars={(cars ?? []) as FleetCar[]}
        bookings={bookings}
        curfew={curfew}
      />
    </div>
  );
}
