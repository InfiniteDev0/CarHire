import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type MemberRole = "admin" | "staff";

export interface Membership {
  role: MemberRole;
  is_active: boolean;
}

/**
 * The current user's membership in `orgId` (or null if not a member).
 * RLS lets a user read their own org_members row, so this is safe from the
 * user's server client.
 */
export async function getMembership(
  orgId: string
): Promise<{ userId: string | null; membership: Membership | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { userId: null, membership: null };

  const { data } = await supabase
    .from("org_members")
    .select("role, is_active")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  return { userId: user.id, membership: (data as Membership | null) ?? null };
}

/**
 * Admin-only route guard. Redirects non-admins away. Use at the top of any
 * admin-only server component (e.g. the staff page).
 */
export async function requireAdmin(orgId: string): Promise<{ userId: string }> {
  const { userId, membership } = await getMembership(orgId);
  if (!userId) redirect("/auth");
  if (!membership || membership.role !== "admin" || !membership.is_active) {
    redirect(`/workspace/${orgId}`);
  }
  return { userId };
}
