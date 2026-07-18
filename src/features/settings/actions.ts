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
    })
    .eq("id", orgId);

  if (error) throw new Error(error.message);
}
