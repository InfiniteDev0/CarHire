/**
 * Turn a Supabase auth error into a human message. Supabase returns a
 * stable `code` on most auth errors (falls back to status / message).
 */
export function authErrorMessage(error) {
  if (!error) return "Something went wrong. Please try again.";

  switch (error.code) {
    case "invalid_credentials":
      return "Wrong email or password.";
    case "email_not_confirmed":
      return "Confirm your email first — check your inbox.";
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists.";
    case "weak_password":
      return "That password is too weak. Try a stronger one.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Wait a minute and try again.";
    case "same_password":
      return "New password must differ from the old one.";
    case "validation_failed":
      return "Please check the details and try again.";
    default:
      // Network / fetch failures surface as TypeError with no code.
      if (error.name === "TypeError" || error.message === "Failed to fetch") {
        return "Network error — check your connection and retry.";
      }
      return error.message || "Something went wrong. Please try again.";
  }
}
