import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth / email-link callback. Supabase forwards here after email confirmation,
 * a password-reset request, or OAuth. We establish a session (cookies get
 * written by the server client) and forward the user to `next` (defaults to the
 * entry router at "/").
 *
 * Two link formats are supported so this keeps working regardless of the
 * Supabase email-template style:
 *  - `?code=…`            → PKCE, exchanged for a session (needs the verifier
 *                            cookie set in the same browser that requested it).
 *  - `?token_hash=&type=` → server-side OTP verification, no verifier needed
 *                            (survives opening the link on another device).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";
  const errorDescription = searchParams.get("error_description");

  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(errorDescription)}`
    );
  }

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(error.message)}`
    );
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(
      `${origin}/auth?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(
    `${origin}/auth?error=${encodeURIComponent("That link is invalid or has expired. Please request a new one.")}`
  );
}
