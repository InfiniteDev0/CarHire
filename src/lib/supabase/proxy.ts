import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Paths reachable without a session. Everything else requires auth.
// The login/signup UI lives under /auth; the Paystack webhook is a
// server-to-server POST (no user session) that verifies its own signature.
const PUBLIC_PREFIXES = ["/auth", "/api/paystack"];

// Auth paths that MUST stay reachable even while signed in. The email-link
// callback lands here with a fresh recovery/confirmation session, and the
// "set a new password" screen only works once that session exists — so we
// must NOT bounce an authenticated user away from these.
const SIGNED_IN_ALLOWED = ["/auth/callback", "/auth/reset-password"];

function isPublic(pathname) {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

function allowedWhileSignedIn(pathname) {
  return SIGNED_IN_ALLOWED.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

/**
 * Refresh the Supabase session on every request and enforce a coarse auth
 * guard. This is an OPTIMISTIC check only — real authorization lives in RLS
 * and in each server component/action. Do not trust it alone.
 */
export async function updateSession(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() (not getSession) revalidates the token with Supabase.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Not signed in and trying to reach a protected page → send to /auth.
  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  // Signed in but sitting on an auth page → bounce to the router at "/",
  // EXCEPT the callback + password-reset screens, which are meant to be used
  // while holding a fresh email-link session.
  if (user && isPublic(pathname) && !allowedWhileSignedIn(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return response;
}
