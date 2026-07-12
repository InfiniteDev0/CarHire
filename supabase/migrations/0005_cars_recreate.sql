-- Full `cars` setup — run this if the table was dropped. Idempotent.
-- Assumes organizations + the is_org_member/is_org_admin helpers already exist
-- (from schema.sql). Supersedes 0003/0004 for the cars table.

-- Status enum (guarded)
do $$ begin
  create type car_status as enum ('AVAILABLE', 'TRIP', 'MAINTENANCE');
exception when duplicate_object then null; end $$;

create table if not exists cars (
  id                uuid primary key default gen_random_uuid(),
  org_id            uuid not null references organizations(id) on delete cascade,
  reg_number        text not null,
  make              text,
  model             text,
  capacity          int,
  status            car_status not null default 'AVAILABLE',
  county            text,
  color             text,
  rate_per_day      numeric(12,2),
  notes             text,
  -- extended detail fields
  year              int,
  body_type         text,
  transmission      text,
  fuel_type         text,
  engine            text,
  mileage           int,
  domicile          text,
  image_url         text,
  owner_name        text,
  num_owners        int,
  insurance_expiry  date,
  inspection_status text,
  decommissioned_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (org_id, reg_number)
);

create index if not exists idx_cars_org on cars(org_id, status);

-- keep updated_at fresh (touch_updated_at() defined in schema.sql)
drop trigger if exists trg_touch_cars on cars;
create trigger trg_touch_cars before update on cars
  for each row execute function touch_updated_at();

-- RLS: members read, admins write
alter table cars enable row level security;

drop policy if exists cars_read on cars;
create policy cars_read on cars for select using (is_org_member(org_id));

drop policy if exists cars_write on cars;
create policy cars_write on cars for all using (is_org_admin(org_id)) with check (is_org_admin(org_id));

notify pgrst, 'reload schema';
