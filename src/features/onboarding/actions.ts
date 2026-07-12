"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOrgSchema, toMoney, type CreateOrgInput } from "@/lib/validation/org";

export interface CompleteOnboardingResult {
  orgId: string;
  invitesSent: number;
  invitesFailed: number;
}

/**
 * Creates an organization for the current user (the DB trigger makes them its
 * admin), then optionally invites co-admins via the service-role Admin API.
 * Invites are best-effort: a failed invite never blocks workspace creation.
 */
export async function completeOnboarding(
  input: CreateOrgInput
): Promise<CompleteOnboardingResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be signed in.");

  const parsed = createOrgSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid details.");
  }
  const v = parsed.data;

  // Insert the org as the signed-in user (RLS: owner_id must equal auth.uid()).
  const { data: org, error } = await supabase
    .from("organizations")
    .insert({
      owner_id: user.id,
      name: v.name,
      county: v.county || null,
      phone: v.phone ? `+254${v.phone}` : null,
      fleet_size: v.fleetSize || null,
      curfew_start: v.curfewStart || null,
      curfew_end: v.curfewEnd || null,
      rate_floor: toMoney(v.rateFloor),
      rate_ceiling: toMoney(v.rateCeiling),
    })
    .select("id")
    .single();

  if (error || !org) {
    throw new Error(error?.message ?? "Could not create your workspace.");
  }

  const orgId = org.id as string;

  // Invite co-admins (needs service role — only spin it up if there are invites).
  let invitesSent = 0;
  let invitesFailed = 0;

  if (v.inviteEmails.length > 0) {
    const admin = createAdminClient();
    const h = await headers();
    const origin =
      h.get("origin") ??
      (h.get("host") ? `https://${h.get("host")}` : undefined);
    const redirectTo = origin
      ? `${origin}/auth/callback?next=/auth/reset-password`
      : undefined;

    for (const email of v.inviteEmails) {
      try {
        const { data: invited, error: invErr } =
          await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
        if (invErr || !invited?.user) {
          invitesFailed++;
          continue;
        }
        const { error: memberErr } = await admin.from("org_members").insert({
          org_id: orgId,
          user_id: invited.user.id,
          role: "admin",
          is_active: true,
        });
        if (memberErr) invitesFailed++;
        else invitesSent++;
      } catch {
        invitesFailed++;
      }
    }
  }

  return { orgId, invitesSent, invitesFailed };
}
