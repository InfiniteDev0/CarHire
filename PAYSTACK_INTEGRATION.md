# Paystack recurring billing

Plan lives on `organizations.plan` (enum `FREE/PRO/BUSINESS`). Paid plans are
**recurring subscriptions** via Paystack Plans. The webhook is the source of
truth for the plan lifecycle; the checkout callback just gives instant feedback.

## One-time setup (Paystack dashboard, test mode first)

1. **Create four Plans** (Plans → New Plan). Monthly and annual are separate
   plans because a Paystack Plan has a fixed interval.

   | Plan | Interval | Amount (KES) |
   |------|----------|--------------|
   | Pro Monthly | Monthly | 2,500 |
   | Pro Annual | Annually | 24,000  (2500 × 12 − 20%) |
   | Business Monthly | Monthly | 6,000 |
   | Business Annual | Annually | 57,600  (6000 × 12 − 20%) |

2. **Copy each `plan_code`** (`PLN_…`) into `.env.local`:
   ```
   PAYSTACK_PLAN_PRO_MONTHLY=PLN_…
   PAYSTACK_PLAN_PRO_ANNUAL=PLN_…
   PAYSTACK_PLAN_BUSINESS_MONTHLY=PLN_…
   PAYSTACK_PLAN_BUSINESS_ANNUAL=PLN_…
   ```

3. **Set the webhook URL** (Settings → API Keys & Webhooks → Webhook URL):
   ```
   https://<your-domain>/api/paystack/webhook
   ```
   Local testing: expose it with `ngrok http 3000` and use the ngrok URL.

## How it flows

- `initPaystackCheckout(orgId, plan, billing)` → starts a **card-only**
  subscription checkout for the matching plan code (recurring charges can't be
  taken on M-Pesa, so the hosted page is card only).
- Paystack redirects back to `…/pricing/checkout/verify` → activates the plan
  immediately so the admin sees success without waiting.
- The **webhook** (`/api/paystack/webhook`, HMAC-SHA512 verified) then keeps it
  in sync going forward:
  - `charge.success` → set `plan`, `plan_status=active`, store customer/subscription codes
  - `subscription.create` → record `plan_renews_at`
  - `invoice.payment_failed` → `plan_status=past_due`
  - `subscription.disable` / `subscription.not_renew` → revert `plan=FREE`,
    `plan_status=canceled`
- Every webhook event id is recorded in `paystack_webhook_events` so retries are
  idempotent.

Because `canCreateWorkspace` reads `organizations.plan` live, a cancellation
that flips a Business org back to FREE also removes its "create more workspaces"
privilege automatically — no cascade code.

## Migration

`supabase/migrations/0019_paystack_billing.sql` (applied live) adds
`plan_status`, `plan_renews_at`, `paystack_customer_code`,
`paystack_subscription_code`, and the `paystack_webhook_events` table.
