-- Subscription plan per organization. Free-tier limits only bite on FREE.
do $$ begin
  create type org_plan as enum ('FREE', 'PRO', 'BUSINESS');
exception when duplicate_object then null; end $$;

alter table organizations add column if not exists plan org_plan not null default 'FREE';
alter table organizations add column if not exists plan_activated_at timestamptz;

notify pgrst, 'reload schema';
