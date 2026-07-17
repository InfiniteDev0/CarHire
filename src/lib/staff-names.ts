import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * user_id → display name for every member of the org — used to show who
 * created/recorded things (rentals, payments, complaints, vehicles, clients).
 */
export async function getStaffNames(
  supabase: SupabaseClient,
  orgId: string
): Promise<Record<string, string>> {
  const { data } = await supabase
    .from("org_members")
    .select("user_id, full_name")
    .eq("org_id", orgId);
  return Object.fromEntries(
    (data ?? []).map((m) => [m.user_id as string, (m.full_name as string) || "Staff"])
  );
}
