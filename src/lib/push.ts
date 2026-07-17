import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails("mailto:notifications@carhire.app", pub, priv);
  configured = true;
  return true;
}

/**
 * Push a notification to every subscribed browser of every member of `orgId`.
 * Best-effort and fire-safe: failures never break the calling action; dead
 * subscriptions (410/404) are pruned as they're found.
 */
export async function sendPushToOrg(orgId: string, payload: PushPayload): Promise<void> {
  try {
    if (!ensureConfigured()) return;

    const admin = createAdminClient();
    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("org_id", orgId);
    if (!subs || subs.length === 0) return;

    const body = JSON.stringify(payload);
    await Promise.allSettled(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            body
          );
        } catch (err) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            await admin.from("push_subscriptions").delete().eq("endpoint", s.endpoint);
          }
        }
      })
    );
  } catch {
    // Never let notification plumbing break business actions.
  }
}
