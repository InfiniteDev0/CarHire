import { createClient } from "@supabase/supabase-js";

/**
 * SERVER-ONLY Supabase client using the service-role key.
 * Bypasses RLS — use only inside Server Actions / Route Handlers for
 * privileged operations (e.g. creating staff auth users in Phase 2).
 *
 * NEVER import this into a Client Component. The service-role key must never
 * reach the browser bundle, so it is read from a non-public env var.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
