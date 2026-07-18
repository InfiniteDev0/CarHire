"use client";

import { useEffect } from "react";
import { heartbeat } from "./presence-actions";

const INTERVAL_MS = 2 * 60_000;

/** Invisible — pings presence on mount and every 2 minutes while open. */
export function PresenceHeartbeat({ orgId }: { orgId: string }) {
  useEffect(() => {
    let cancelled = false;
    const ping = () => {
      if (!cancelled && document.visibilityState === "visible") {
        heartbeat(orgId).catch(() => {});
      }
    };
    ping();
    const id = setInterval(ping, INTERVAL_MS);
    document.addEventListener("visibilitychange", ping);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", ping);
    };
  }, [orgId]);

  return null;
}
