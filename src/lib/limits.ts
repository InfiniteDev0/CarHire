import type { SupabaseClient } from "@supabase/supabase-js";

// Free-tier caps. Beyond these an org must upgrade to Pro.
export const FREE_LIMITS = { staff: 5, vehicles: 5, clients: 5, rentals: 5 } as const;
export type LimitKey = keyof typeof FREE_LIMITS;

export type OrgPlan = "FREE" | "PRO" | "BUSINESS";

export const PLAN_LABELS: Record<OrgPlan, string> = {
  FREE: "Free",
  PRO: "Pro",
  BUSINESS: "Business",
};

// How many workspaces (businesses) a user may run on their best plan.
// Free = the one they start with; Pro adds two more; Business up to six.
export const WORKSPACE_LIMITS: Record<OrgPlan, number> = {
  FREE: 1,
  PRO: 3,
  BUSINESS: 6,
};

const PLAN_RANK: Record<OrgPlan, number> = { FREE: 0, PRO: 1, BUSINESS: 2 };

/** The strongest plan among a set (e.g. all the orgs a user admins). */
export function bestPlan(plans: OrgPlan[]): OrgPlan {
  return plans.reduce<OrgPlan>(
    (best, p) => (PLAN_RANK[p] > PLAN_RANK[best] ? p : best),
    "FREE"
  );
}

/** How many workspaces this user is entitled to, given their orgs' plans. */
export function workspaceAllowance(adminPlans: OrgPlan[]): number {
  return WORKSPACE_LIMITS[bestPlan(adminPlans)];
}

/** The message to show when a user can't create another workspace. */
export function workspaceLimitMessage(plan: OrgPlan): string {
  if (plan === "BUSINESS") {
    return `You've reached the maximum of ${WORKSPACE_LIMITS.BUSINESS} workspaces.`;
  }
  if (plan === "PRO") {
    return `You're at your Pro limit of ${WORKSPACE_LIMITS.PRO} workspaces. Upgrade to Business for up to ${WORKSPACE_LIMITS.BUSINESS}.`;
  }
  return "Upgrade to Pro to run more than one workspace.";
}

/** The org's subscription plan (defaults to FREE if unreadable). */
export async function getOrgPlan(
  supabase: SupabaseClient,
  orgId: string
): Promise<OrgPlan> {
  const { data } = await supabase
    .from("organizations")
    .select("plan")
    .eq("id", orgId)
    .maybeSingle();
  return ((data?.plan as OrgPlan) ?? "FREE") satisfies OrgPlan;
}

export interface OrgUsage {
  staff: number;
  vehicles: number;
  clients: number;
  rentals: number;
}

const LIMIT_LABEL: Record<LimitKey, string> = {
  staff: "staff members",
  vehicles: "vehicles",
  clients: "clients",
  rentals: "rentals",
};

/** Current counts for an org. Errors (e.g. missing table) count as 0. */
export async function getOrgUsage(
  supabase: SupabaseClient,
  orgId: string
): Promise<OrgUsage> {
  const [staff, vehicles, clients, rentals] = await Promise.all([
    supabase
      .from("org_members")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("role", "staff"),
    supabase
      .from("cars")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .is("decommissioned_at", null),
    supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),
    supabase
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),
  ]);
  return {
    staff: staff.count ?? 0,
    vehicles: vehicles.count ?? 0,
    clients: clients.count ?? 0,
    rentals: rentals.count ?? 0,
  };
}

export function isAnyLimitReached(usage: OrgUsage): boolean {
  return (Object.keys(FREE_LIMITS) as LimitKey[]).some(
    (key) => usage[key] >= FREE_LIMITS[key]
  );
}

/**
 * Throw a friendly limit error if `orgId` is already at the cap for `key`.
 * Paid plans (PRO/BUSINESS) are unlimited — the check short-circuits.
 */
export async function assertUnderLimit(
  supabase: SupabaseClient,
  orgId: string,
  key: LimitKey
): Promise<void> {
  const plan = await getOrgPlan(supabase, orgId);
  if (plan !== "FREE") return;

  const usage = await getOrgUsage(supabase, orgId);
  if (usage[key] >= FREE_LIMITS[key]) {
    throw new Error(
      `You've reached the free limit of ${FREE_LIMITS[key]} ${LIMIT_LABEL[key]}. Upgrade to Pro to add more.`
    );
  }
}
