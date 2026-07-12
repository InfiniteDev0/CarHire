# Bruno — manual auth testing

Hit Supabase's auth API (GoTrue) directly, independent of the Next app. Useful
for confirming your project + keys work and for poking at edge cases.

## Setup
1. Open [Bruno](https://www.usebruno.com/) → **Open Collection** → select
   `admin/bruno/carhire-auth`.
2. Top-right environment dropdown → **Local** → edit and fill in:
   - `supabaseUrl` — your project URL
   - `anonKey` — the anon/public key
   - `testEmail` / `testPassword` — a throwaway login
3. Run the requests in order (they're numbered).

## Flow
| # | Request | What it proves |
|---|---------|----------------|
| 1 | Signup | Creates a user. Session returned only if email confirmation is OFF. |
| 2 | Login | Password grant → saves `accessToken` + `refreshToken` to the env. |
| 3 | Get User | The access token resolves to your user. |
| 4 | Forgot Password | Triggers a reset email (200 even for unknown emails). |
| 5 | Refresh Token | Rotates the access token — same thing `proxy.js` does per request. |
| 6 | Logout | Revokes the session (204). Get User then returns 401. |

> `accessToken` / `refreshToken` are marked secret in the env and auto-populated
> by the post-response scripts on Login/Refresh — don't fill them by hand.
