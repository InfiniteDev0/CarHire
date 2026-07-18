"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Presence heartbeat — called every couple of minutes while a member has the
 * workspace open. "Online" = seen in the last ~3 minutes; once they log out
 * (end of shift) the heartbeat stops and they show as "left Xh ago".
 * Service role does the write because org_members writes are admin-gated.
 */
export async function heartbeat(orgId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const admin = createAdminClient();
  await admin
    .from("org_members")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .eq("is_active", true);
}
