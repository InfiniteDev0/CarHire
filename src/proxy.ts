import { updateSession } from "@/lib/supabase/proxy";

// Next 16: the former `middleware` convention is now `proxy`.
export async function proxy(request) {
  return updateSession(request);
}

export const config = {
  // Run on all routes except static assets and image files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
