-- Web-push subscriptions — one row per browser a member enabled
-- notifications on. Endpoint is unique; re-subscribing upserts.
create table if not exists push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references organizations(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_push_subs_org on push_subscriptions(org_id);

alter table push_subscriptions enable row level security;

-- Each member manages only their own subscriptions. Sending uses the
-- service-role client server-side, which bypasses RLS.
drop policy if exists push_subs_own on push_subscriptions;
create policy push_subs_own on push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid() and is_org_member(org_id));

notify pgrst, 'reload schema';
