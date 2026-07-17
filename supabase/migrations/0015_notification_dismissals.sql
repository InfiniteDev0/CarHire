-- Per-user dismissed notification keys (computed feed items carry stable
-- keys like "overdue-<contractId>"). Dismissing hides the item everywhere
-- for that user until the underlying thing resolves.
create table if not exists notification_dismissals (
  user_id      uuid not null references auth.users(id) on delete cascade,
  org_id       uuid not null references organizations(id) on delete cascade,
  key          text not null,
  dismissed_at timestamptz not null default now(),
  primary key (user_id, key)
);

create index if not exists idx_dismissals_org on notification_dismissals(org_id, user_id);

alter table notification_dismissals enable row level security;
drop policy if exists dismissals_own on notification_dismissals;
create policy dismissals_own on notification_dismissals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid() and is_org_member(org_id));

notify pgrst, 'reload schema';
