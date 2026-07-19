"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOrgSchema, toMoney, type CreateOrgInput } from "@/lib/validation/org";
import {
  workspaceAllowance,
  workspaceLimitMessage,
  bestPlan,
  type OrgPlan,
} from "@/lib/limits";

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

  // Workspace allowance scales with the user's best plan (Free 1 / Pro 3 /
  // Business 6). Your first is always free; beyond that you must be under the
  // cap of the strongest plan among the orgs you already admin.
  const { data: existing } = await supabase
    .from("org_members")
    .select("role, organizations(plan)")
    .eq("user_id", user.id)
    .eq("is_active", true);
  const adminPlans = (
    (existing ?? []) as unknown as {
      role: string;
      organizations: { plan: string | null } | null;
    }[]
  )
    .filter((m) => m.role === "admin")
    .map((m) => (m.organizations?.plan ?? "FREE") as OrgPlan);
  if (adminPlans.length >= workspaceAllowance(adminPlans)) {
    throw new Error(workspaceLimitMessage(bestPlan(adminPlans)));
  }

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
      phone: v.phone || null, // already E.164 from the PhoneInput
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

  // Additional workspaces inherit the creator's best plan — one paid
  // subscription covers all the workspaces their plan allows, so there's no
  // second checkout. Written with the service role so plan can't be forged
  // from the client. (The first workspace stays FREE until they pay.)
  const inheritedPlan = bestPlan(adminPlans);
  if (adminPlans.length > 0 && inheritedPlan !== "FREE") {
    const admin = createAdminClient();
    await admin
      .from("organizations")
      .update({ plan: inheritedPlan, plan_activated_at: new Date().toISOString() })
      .eq("id", orgId);
  }

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
