-- Deposit-driven rentals, extension authorization log, trip reports, and
-- richer client KYC (Smart DL, multiple next of kin, created_by). Idempotent.

-- Each car carries a pickup deposit price, set by the admin (cars_write RLS
-- is already admin-only, so no new policy needed).
alter table cars add column if not exists deposit numeric(12,2);

-- The deposit collected when the agreement is created.
alter table contracts add column if not exists deposit_amount numeric(12,2) not null default 0;

-- Extension log: a client must pay part of the remaining balance (default
-- half, admin can adjust) before an extension is authorized.
create table if not exists contract_extensions (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references organizations(id) on delete cascade,
  contract_id      uuid not null references contracts(id) on delete cascade,
  extra_days       int not null check (extra_days >= 1),
  required_payment numeric(12,2) not null default 0,
  amount_paid      numeric(12,2) not null default 0,
  created_by       uuid references auth.users(id),
  created_at       timestamptz not null default now()
);
create index if not exists idx_extensions_contract on contract_extensions(contract_id);

alter table contract_extensions enable row level security;
drop policy if exists extensions_read on contract_extensions;
create policy extensions_read on contract_extensions for select using (is_org_member(org_id));
drop policy if exists extensions_write on contract_extensions;
create policy extensions_write on contract_extensions for all using (is_org_member(org_id)) with check (is_org_member(org_id));

-- Trip report — filled by staff/admin after a trip completes.
do $$ begin
  create type car_return_condition as enum ('EXCELLENT', 'GOOD', 'MINOR_ISSUES', 'DAMAGED');
exception when duplicate_object then null; end $$;

create table if not exists trip_reports (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  contract_id   uuid not null unique references contracts(id) on delete cascade,
  car_condition car_return_condition not null default 'GOOD',
  client_rating int check (client_rating between 1 and 5),
  performance   text,                -- how the client handled the trip
  damages       text,                -- what was damaged, if anything
  damage_plan   text,                -- how the damages will be dealt with
  filled_by     uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_touch_trip_reports on trip_reports;
create trigger trg_touch_trip_reports before update on trip_reports
  for each row execute function touch_updated_at();

alter table trip_reports enable row level security;
drop policy if exists trip_reports_read on trip_reports;
create policy trip_reports_read on trip_reports for select using (is_org_member(org_id));
drop policy if exists trip_reports_write on trip_reports;
create policy trip_reports_write on trip_reports for all using (is_org_member(org_id)) with check (is_org_member(org_id));

-- Client KYC: Smart DL number replaces KRA PIN in the UI (kra_pin column kept
-- for old data), multiple next of kin as [{name, phone, relationship}], and
-- who registered the client.
alter table clients add column if not exists dl_number text;
alter table clients add column if not exists next_of_kins jsonb not null default '[]'::jsonb;
alter table clients add column if not exists created_by uuid references auth.users(id);

notify pgrst, 'reload schema';
