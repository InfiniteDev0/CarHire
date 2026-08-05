import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToOrg } from "@/lib/push";

/**
 * The single entry point for "something happened" in the app. Business logic
 * calls emitEvent(...) once; every channel fans out from here so new channels
 * (email, Inngest) can be added without touching business logic.
 *
 *   Action → emitEvent → DB notification (Realtime) → web push → email → jobs
 */
export interface AppEvent {
  /** Dotted event name, e.g. "payment.received", "rental.overdue". */
  type: string;
  orgId: string;
  title: string;
  body?: string;
  /** Where clicking the notification should go. */
  href?: string;
  /** Target a specific member; omit for the whole org. */
  userId?: string | null;
  /** Who triggered it (for attribution / audit). */
  actorId?: string | null;
  entityType?: string;
  entityId?: string;
  /** Also send a browser push (default true). */
  push?: boolean;
}

export async function emitEvent(event: AppEvent): Promise<void> {
  const admin = createAdminClient();

  // 1) Persist a notification — source of truth for the bell + Realtime.
  //    Never let a notification failure break the underlying action.
  try {
    await admin.from("notifications").insert({
      org_id: event.orgId,
      user_id: event.userId ?? null,
      type: event.type,
      title: event.title,
      body: event.body ?? null,
      href: event.href ?? null,
      entity_type: event.entityType ?? null,
      entity_id: event.entityId ?? null,
      actor_id: event.actorId ?? null,
    });
  } catch {
    /* swallow — best-effort */
  }

  // 2) Web push (best-effort; prunes dead subscriptions internally).
  if (event.push !== false) {
    await sendPushToOrg(event.orgId, {
      title: event.title,
      body: event.body ?? "",
      url: event.href ?? `/workspace/${event.orgId}`,
    }).catch(() => {});
  }

  // 3) TODO (Phase 4) — email via Resend.
  // 4) TODO (Phase 5) — publish to Inngest for background workflows.
}
