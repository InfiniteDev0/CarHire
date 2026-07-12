"use server";

import { createClient } from "@/lib/supabase/server";
import { orgSettingsSchema, type OrgSettingsInput } from "@/lib/validation/settings";

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

export async function updateOrgSettings(
  orgId: string,
  input: OrgSettingsInput
): Promise<void> {
  const supabase = await assertAdmin(orgId);

  const parsed = orgSettingsSchema.safeParse(input);
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
      curfew_start: v.curfewStart || null,
      curfew_end: v.curfewEnd || null,
      rate_floor: v.rateFloor ? Number(v.rateFloor) : null,
      rate_ceiling: v.rateCeiling ? Number(v.rateCeiling) : null,
    })
    .eq("id", orgId);

  if (error) throw new Error(error.message);
}
