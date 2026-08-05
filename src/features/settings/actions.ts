"use server";

import { createClient } from "@/lib/supabase/server";
import {
  orgGeneralSchema,
  orgOperationsSchema,
  type OrgGeneralInput,
  type OrgOperationsInput,
} from "@/lib/validation/settings";

async function assertAdmin(orgId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be signed in.");

  const { data } = await supabase
    .from("org_members")
    .select("role, is_active")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data || data.role !== "admin" || !data.is_active) {
    throw new Error("Only admins can change workspace settings.");
  }
  return supabase;
}

export async function updateOrgGeneral(
  orgId: string,
  input: OrgGeneralInput
): Promise<void> {
  const supabase = await assertAdmin(orgId);

  const parsed = orgGeneralSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid settings.");
  }
  const v = parsed.data;

  const { error } = await supabase
    .from("organizations")
    .update({
      name: v.name,
      phone: v.phone || null,
      county: v.county || null,
    })
    .eq("id", orgId);

  if (error) throw new Error(error.message);
}

export type WorkingHours = Record<number, { from: number; to: number }>;

/** Admin-only: save the per-day calendar working hours (Settings → Operations). */
export async function updateCalendarWorkingHours(
  orgId: string,
  workingHours: WorkingHours
): Promise<void> {
  const supabase = await assertAdmin(orgId);

  // Sanitise: keep 0–24 integer hours for days 0..6.
  const clean: WorkingHours = {};
  for (let d = 0; d < 7; d++) {
    const h = workingHours[d] ?? { from: 0, to: 0 };
    const from = Math.min(24, Math.max(0, Math.round(Number(h.from) || 0)));
    const to = Math.min(24, Math.max(0, Math.round(Number(h.to) || 0)));
    clean[d] = { from, to };
  }

  const { error } = await supabase
    .from("organizations")
    .update({ cal_working_hours: clean })
    .eq("id", orgId);
  if (error) throw new Error(error.message);
}

export async function updateOrgOperations(
  orgId: string,
  input: OrgOperationsInput
): Promise<void> {
  const supabase = await assertAdmin(orgId);

  const parsed = orgOperationsSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid settings.");
  }
  const v = parsed.data;

  const { error } = await supabase
    .from("organizations")
    .update({
      curfew_start: v.curfewStart || null,
      curfew_end: v.curfewEnd || null,
      rate_floor: v.rateFloor ? Number(v.rateFloor) : null,
      rate_ceiling: v.rateCeiling ? Number(v.rateCeiling) : null,
      refuel_penalty_per_level: v.refuelPenalty ? Number(v.refuelPenalty) : 1500,
      allow_multiple_rentals: v.allowMultipleRentals,
      // When multiple is on, default the cap to 2; otherwise it's just 1.
      max_concurrent_rentals: v.allowMultipleRentals
        ? Math.max(2, Number(v.maxConcurrentRentals) || 2)
        : 1,
      cal_badge_variant: v.calBadgeVariant,
      cal_visible_start: v.calVisibleStart !== "" ? Number(v.calVisibleStart) : 7,
      cal_visible_end: v.calVisibleEnd !== "" ? Number(v.calVisibleEnd) : 18,
      cal_work_start: v.calWorkStart !== "" ? Number(v.calWorkStart) : 8,
      cal_work_end: v.calWorkEnd !== "" ? Number(v.calWorkEnd) : 17,
    })
    .eq("id", orgId);

  if (error) throw new Error(error.message);
}
