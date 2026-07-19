-- 0019_paystack_billing.sql
-- Recurring-subscription billing state for the per-org plan (org_plan enum from
-- 0013). No `plans`/`subscriptions` tables exist in this app — plan lives on
-- organizations.plan, so its billing state lives there too. Idempotent.

do $$ begin
  create type plan_status as enum ('active', 'past_due', 'canceled');
exception when duplicate_object then null; end $$;

alter table organizations add column if not exists plan_status plan_status not null default 'active';
alter table organizations add column if not exists plan_renews_at timestamptz;
alter table organizations add column if not exists paystack_customer_code text;
alter table organizations add column if not exists paystack_subscription_code text;

-- Look up the org fast when a webhook only carries the customer code.
create index if not exists organizations_paystack_customer_code_idx
  on organizations (paystack_customer_code);

-- Webhook retry idempotency guard: every processed event id is recorded once.
create table if not exists paystack_webhook_events (
  id           text primary key, -- Paystack event id / transaction reference
  event_type   text not null,
  processed_at timestamptz not null default now()
);

notify pgrst, 'reload schema';
