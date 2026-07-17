import { createClient } from "@/lib/supabase/server";
import {
  RentalCalendar,
  type CalendarEvent,
} from "@/features/calendar/components/rental-calendar";

export const metadata = { title: "Calendar · CarHire" };

interface CalContract {
  id: string;
  status: string;
  contract_start: string | null;
  contract_expiration: string | null;
  clients: { full_name: string } | null;
  cars: { reg_number: string } | null;
}

const toKey = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("contracts")
    .select(
      "id, status, contract_start, contract_expiration, clients(full_name), cars(reg_number)"
    )
    .eq("org_id", orgId)
    .in("status", ["ACTIVE", "COMPLETED"])
    .not("contract_start", "is", null);

  const contracts = (data ?? []) as unknown as CalContract[];

  const events: CalendarEvent[] = [];
  const now = Date.now();
  for (const c of contracts) {
    const base = {
      contractId: c.id,
      regNumber: c.cars?.reg_number ?? "—",
      clientName: c.clients?.full_name ?? "—",
    };
    if (c.contract_start) {
      events.push({ ...base, id: `${c.id}-START`, date: toKey(c.contract_start), kind: "START" });
    }
    if (c.contract_expiration) {
      const overdue =
        c.status === "ACTIVE" && new Date(c.contract_expiration).getTime() < now;
      events.push({
        ...base,
        id: `${c.id}-RETURN`,
        date: toKey(c.contract_expiration),
        kind: overdue ? "OVERDUE" : "RETURN",
      });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-xl">Calendar</h1>
        <p className="text-sm text-muted-foreground">
          Checkouts, expected returns and overdue rentals at a glance.
        </p>
      </div>

      <RentalCalendar orgId={orgId} events={events} />
    </div>
  );
}
