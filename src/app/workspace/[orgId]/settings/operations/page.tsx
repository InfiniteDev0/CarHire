import { requireAdmin } from "@/lib/auth/membership";
import { createClient } from "@/lib/supabase/server";
import {
  OrgOperationsForm,
  type OrgOperations,
} from "@/features/settings/components/org-operations-form";
import { CalendarWorkingHoursForm } from "@/features/settings/components/calendar-working-hours-form";
import type { WorkingHours } from "@/features/settings/actions";

export const metadata = { title: "Operations · Settings · Socdal" };

const DEFAULT_WORKING: WorkingHours = {
  0: { from: 0, to: 0 },
  1: { from: 9, to: 17 },
  2: { from: 9, to: 17 },
  3: { from: 9, to: 17 },
  4: { from: 9, to: 17 },
  5: { from: 9, to: 17 },
  6: { from: 9, to: 13 },
};

export default async function OperationsSettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  await requireAdmin(orgId);

  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select(
      "curfew_start, curfew_end, rate_floor, rate_ceiling, refuel_penalty_per_level, allow_multiple_rentals, max_concurrent_rentals, cal_badge_variant, cal_visible_start, cal_visible_end, cal_work_start, cal_work_end, cal_working_hours"
    )
    .eq("id", orgId)
    .maybeSingle();

  const workingHours = (org?.cal_working_hours as WorkingHours) ?? DEFAULT_WORKING;

  // time columns come back as "HH:MM:SS" — trim for the time inputs.
  const t = (v: string | null) => (v ? v.slice(0, 5) : "");
  const initial: OrgOperations = {
    curfewStart: t(org?.curfew_start ?? null),
    curfewEnd: t(org?.curfew_end ?? null),
    rateFloor: org?.rate_floor != null ? String(org.rate_floor) : "",
    rateCeiling: org?.rate_ceiling != null ? String(org.rate_ceiling) : "",
    refuelPenalty:
      org?.refuel_penalty_per_level != null ? String(org.refuel_penalty_per_level) : "1500",
    allowMultipleRentals: org?.allow_multiple_rentals ?? false,
    maxConcurrentRentals:
      org?.max_concurrent_rentals != null ? String(org.max_concurrent_rentals) : "2",
    calBadgeVariant: (org?.cal_badge_variant as "dot" | "colored" | "mixed") ?? "colored",
    calVisibleStart: String(org?.cal_visible_start ?? 7),
    calVisibleEnd: String(org?.cal_visible_end ?? 18),
    calWorkStart: String(org?.cal_work_start ?? 8),
    calWorkEnd: String(org?.cal_work_end ?? 17),
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h2 className="text-sm font-medium">Operations</h2>
        <p className="text-xs text-muted-foreground">
          Operating rules — curfew and rate guardrails apply to every new rental.
        </p>
      </div>
      <OrgOperationsForm orgId={orgId} initial={initial} />

      <div className="mt-2 max-w-xl border-t pt-6">
        <CalendarWorkingHoursForm orgId={orgId} initial={workingHours} />
      </div>
    </div>
  );
}
