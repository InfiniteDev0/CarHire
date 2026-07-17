"use server";

import { createClient } from "@/lib/supabase/server";

async function assertMember(orgId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You need to be signed in.");

  const { data } = await supabase
    .from("org_members")
    .select("is_active")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data || !data.is_active) {
    throw new Error("You're not a member of this workspace.");
  }
  return { supabase, user };
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** Save (or refresh) this browser's push subscription. */
export async function savePushSubscription(
  orgId: string,
  sub: PushSubscriptionInput
): Promise<void> {
  const { supabase, user } = await assertMember(orgId);
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    throw new Error("Invalid subscription.");
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      org_id: orgId,
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
    { onConflict: "endpoint" }
  );
  if (error) throw new Error(error.message);
}

/** Remove this browser's subscription (user turned notifications off). */
export async function removePushSubscription(
  orgId: string,
  endpoint: string
): Promise<void> {
  const { supabase } = await assertMember(orgId);
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}

/** Dismiss one or many feed items for the current user (swipe / clear all). */
export async function dismissNotifications(
  orgId: string,
  keys: string[]
): Promise<void> {
  const { supabase, user } = await assertMember(orgId);
  if (keys.length === 0) return;

  const rows = keys.slice(0, 100).map((key) => ({
    user_id: user.id,
    org_id: orgId,
    key,
  }));
  const { error } = await supabase
    .from("notification_dismissals")
    .upsert(rows, { onConflict: "user_id,key" });
  if (error) throw new Error(error.message);
}
