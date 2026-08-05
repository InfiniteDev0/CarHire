-- 0021_calendar_reminders.sql
-- Calendar reminders (with an attached note) that any member can create,
-- optionally linked to a rental, and mark resolved. Shown as events on the
-- calendar alongside rentals. Idempotent.

create table if not exists calendar_reminders (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  contract_id uuid references contracts(id) on delete set null,
  title       text not null,
  note        text,
  remind_at   timestamptz not null,
  color       text not null default 'yellow',
  resolved    boolean not null default false,
  resolved_at timestamptz,
  created_by  uuid,
  created_at  timestamptz not null default now()
);

create index if not exists idx_calendar_reminders_org on calendar_reminders (org_id, remind_at);

alter table calendar_reminders enable row level security;
drop policy if exists cal_reminders_rw on calendar_reminders;
create policy cal_reminders_rw on calendar_reminders
  for all using (is_org_member(org_id)) with check (is_org_member(org_id));

notify pgrst, 'reload schema';
