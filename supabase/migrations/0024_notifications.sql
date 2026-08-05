-- 0024_notifications.sql
-- Persisted, per-org notifications — the source of truth for the bell and for
-- Supabase Realtime (Phase 2). Written by the service-role event helper.
-- user_id null = the whole org; otherwise a specific member. Idempotent.

create table if not exists notifications (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  user_id     uuid,            -- target member; null = all members of the org
  type        text not null,   -- e.g. 'payment.received', 'rental.overdue'
  title       text not null,
  body        text,
  href        text,
  entity_type text,            -- 'contract' | 'payment' | 'complaint' | ...
  entity_id   uuid,
  actor_id    uuid,            -- who triggered it
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists idx_notifications_org on notifications (org_id, created_at desc);

alter table notifications enable row level security;

-- Members read their org's notifications (org-wide rows + rows targeted to them).
drop policy if exists notifications_read on notifications;
create policy notifications_read on notifications
  for select using (is_org_member(org_id));

-- Members may mark them read (update read_at). Inserts are service-role only.
drop policy if exists notifications_update on notifications;
create policy notifications_update on notifications
  for update using (is_org_member(org_id)) with check (is_org_member(org_id));

-- Enable Supabase Realtime on the table (Phase 2). Ignore if already added.
do $$ begin
  alter publication supabase_realtime add table notifications;
exception when others then null; end $$;

notify pgrst, 'reload schema';
