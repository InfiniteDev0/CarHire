import type { SupabaseClient } from "@supabase/supabase-js";

// Free-tier caps. Beyond these an org must upgrade to Pro.
export const FREE_LIMITS = { staff: 5, vehicles: 5, clients: 5 } as const;
export type LimitKey = keyof typeof FREE_LIMITS;

export interface OrgUsage {
  staff: number;
  vehicles: number;
  clients: number;
}

const LIMIT_LABEL: Record<LimitKey, string> = {
  staff: "staff members",
  vehicles: "vehicles",
  clients: "clients",
};

/** Current counts for an org. Errors (e.g. missing table) count as 0. */
export async function getOrgUsage(
  supabase: SupabaseClient,
  orgId: string
): Promise<OrgUsage> {
  const [staff, vehicles, clients] = await Promise.all([
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
  ]);
  return {
    staff: staff.count ?? 0,
    vehicles: vehicles.count ?? 0,
    clients: clients.count ?? 0,
  };
}

export function isAnyLimitReached(usage: OrgUsage): boolean {
  return (
    usage.staff >= FREE_LIMITS.staff ||
    usage.vehicles >= FREE_LIMITS.vehicles ||
    usage.clients >= FREE_LIMITS.clients
  );
}

/** Throw a friendly limit error if `orgId` is already at the cap for `key`. */
export async function assertUnderLimit(
  supabase: SupabaseClient,
  orgId: string,
  key: LimitKey
): Promise<void> {
  const usage = await getOrgUsage(supabase, orgId);
  if (usage[key] >= FREE_LIMITS[key]) {
    throw new Error(
      `You've reached the free limit of ${FREE_LIMITS[key]} ${LIMIT_LABEL[key]}. Upgrade to Pro to add more.`
    );
  }
}
