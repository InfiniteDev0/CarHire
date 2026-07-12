-- ============================================================================
-- CarHire — Multi-tenant schema with Row Level Security (RLS)
-- ============================================================================
-- Model: one auth user can OWN many organizations. Every business record is
-- scoped by org_id. Staff belong to exactly one org (one org_members row).
-- Isolation is enforced by RLS, not by application code.
--
-- Run this once in the Supabase SQL editor (or `supabase db push` if you use
-- the CLI). Safe to re-run: it is written to be idempotent.
-- ============================================================================

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type member_role    as enum ('admin', 'staff');
exception when duplicate_object then null; end $$;

do $$ begin
  create type car_status     as enum ('AVAILABLE', 'TRIP', 'MAINTENANCE');
exception when duplicate_object then null; end $$;

do $$ begin
  create type contract_status as enum ('DRAFT', 'ACTIVE', 'COMPLETED', 'OVERDUE', 'CANCELLED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type fuel_level     as enum ('EMPTY', 'QUARTER', 'HALF', 'THREE_QUARTER', 'FULL');
exception when duplicate_object then null; end $$;

do $$ begin
  create type complaint_type as enum ('MECHANICAL', 'ACCIDENT', 'BEHAVIOUR', 'BILLING', 'OTHER');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

-- Organizations (tenants)
create table if not exists organizations (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  county        text,                 -- primary operating county (collected at onboarding)
  phone         text,                 -- workspace contact phone (distinct from owner login)
  fleet_size    text,                 -- bucket: '1-5' | '6-20' | '21-50' | '50+'
  -- operational policy knobs used by later phases
  curfew_start  time,                 -- e.g. 22:00 lockout window start
  curfew_end    time,                 -- e.g. 05:00 lockout window end
  rate_floor    numeric(12,2),        -- min allowed rate/day
  rate_ceiling  numeric(12,2),        -- max allowed rate/day
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Membership: which users belong to which org, and their role
create table if not exists org_members (
  org_id       uuid not null references organizations(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         member_role not null default 'staff',
  is_active    boolean not null default true,
  -- staff profile (denormalised from auth.users for easy listing; Phase 2)
  full_name    text,
  email        text,
  phone        text,
  id_front_url text,
  id_back_url  text,
  created_at   timestamptz not null default now(),
  primary key (org_id, user_id)
);

-- Cars
create table if not exists cars (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references organizations(id) on delete cascade,
  reg_number       text not null,
  make             text,
  model            text,
  capacity         int,
  status           car_status not null default 'AVAILABLE',
  county           text,
  color            text,
  rate_per_day     numeric(12,2),      -- default daily rate for this vehicle
  notes            text,
  -- extended detail fields (Phase 3 expanded)
  year             int,
  body_type        text,               -- Sedan / SUV / Hatchback…
  transmission     text,               -- Automatic / Manual
  fuel_type        text,               -- Petrol / Diesel / Electric…
  engine           text,               -- free text, e.g. "2.0L Turbo (249 hp)"
  mileage          int,                -- odometer, km
  domicile         text,               -- home base
  image_url        text,               -- optional photo
  owner_name       text,
  num_owners       int,
  insurance_expiry date,
  inspection_status text,              -- Compliant / Due / Expired
  decommissioned_at timestamptz,       -- soft-delete: keeps trip history intact
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (org_id, reg_number)
);

-- Clients (renters) — KYC lives here
create table if not exists clients (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  full_name     text not null,
  national_id   text,
  phone         text,
  email         text,
  address       text,
  next_of_kin_name  text,
  next_of_kin_phone text,
  id_front_url  text,                  -- Supabase Storage path
  id_back_url   text,
  kra_pin       text,
  secondary_phone text,
  notes         text,
  debt_owed     numeric(12,2) not null default 0,
  is_blocked    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (org_id, national_id)
);

-- Contracts (rental agreements)
create table if not exists contracts (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null references organizations(id) on delete cascade,
  client_id           uuid not null references clients(id) on delete restrict,
  car_id              uuid not null references cars(id) on delete restrict,
  is_self_drive       boolean not null default true,
  driver_name         text,
  driver_dl_number    text,
  driver_dl_expiry    date,
  rate_per_day        numeric(12,2) not null,
  duration_days       int not null,
  routing             text,
  domicile            text,
  status              contract_status not null default 'DRAFT',
  total_amount        numeric(12,2),
  amount_paid         numeric(12,2) not null default 0,
  refuel_penalty      numeric(12,2) not null default 0,
  contract_start      timestamptz,
  contract_expiration timestamptz,
  created_by          uuid references auth.users(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Checkout logs (car dispatched)
create table if not exists checkout_logs (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references organizations(id) on delete cascade,
  contract_id   uuid not null references contracts(id) on delete cascade,
  dispatched_by uuid references auth.users(id),
  mileage       int,
  fuel_at_issue fuel_level,
  signature     text,                  -- MVP: typed-name confirmation
  created_at    timestamptz not null default now()
);

-- Checkin logs (car returned)
create table if not exists checkin_logs (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references organizations(id) on delete cascade,
  contract_id    uuid not null references contracts(id) on delete cascade,
  returned_by    text,                 -- who physically returned it
  received_by    uuid references auth.users(id),
  mileage        int,
  fuel_at_return fuel_level,
  refuel_penalty numeric(12,2) not null default 0,
  created_at     timestamptz not null default now()
);

-- Complaints / incidents
create table if not exists complaints (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  contract_id uuid references contracts(id) on delete set null,
  car_id      uuid references cars(id) on delete set null,
  type        complaint_type not null default 'OTHER',
  description text,
  is_resolved boolean not null default false,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

-- ----------------------------------------------------------------------------
-- Indexes (org_id first — every query is org-scoped)
-- ----------------------------------------------------------------------------
create index if not exists idx_org_members_user   on org_members(user_id);
create index if not exists idx_cars_org           on cars(org_id, status);
create index if not exists idx_clients_org         on clients(org_id);
create index if not exists idx_clients_national_id on clients(org_id, national_id);
create index if not exists idx_contracts_org       on contracts(org_id, status);
create index if not exists idx_contracts_car       on contracts(car_id);
create index if not exists idx_contracts_client    on contracts(client_id);
create index if not exists idx_checkout_contract   on checkout_logs(contract_id);
create index if not exists idx_checkin_contract    on checkin_logs(contract_id);
create index if not exists idx_complaints_org      on complaints(org_id, is_resolved);

-- ----------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER to avoid RLS recursion on org_members)
-- ----------------------------------------------------------------------------
create or replace function is_org_member(target_org uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from org_members
    where org_id = target_org
      and user_id = auth.uid()
      and is_active = true
  );
$$;

create or replace function is_org_admin(target_org uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from org_members
    where org_id = target_org
      and user_id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

-- ----------------------------------------------------------------------------
-- Trigger: creating an org auto-adds the owner as an admin member
-- ----------------------------------------------------------------------------
create or replace function handle_new_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into org_members (org_id, user_id, role, is_active)
  values (new.id, new.owner_id, 'admin', true)
  on conflict (org_id, user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_org_created on organizations;
create trigger on_org_created
  after insert on organizations
  for each row execute function handle_new_org();

-- keep updated_at fresh
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

do $$
declare t text;
begin
  foreach t in array array['organizations','cars','clients','contracts'] loop
    execute format('drop trigger if exists trg_touch_%1$s on %1$s;', t);
    execute format(
      'create trigger trg_touch_%1$s before update on %1$s
       for each row execute function touch_updated_at();', t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Enable RLS on every table
-- ----------------------------------------------------------------------------
alter table organizations enable row level security;
alter table org_members   enable row level security;
alter table cars          enable row level security;
alter table clients       enable row level security;
alter table contracts     enable row level security;
alter table checkout_logs enable row level security;
alter table checkin_logs  enable row level security;
alter table complaints    enable row level security;

-- ----------------------------------------------------------------------------
-- Policies
-- Pattern: members can read; admins can write. Owner special-cases orgs.
-- Drop-then-create so the file is idempotent.
-- ----------------------------------------------------------------------------

-- organizations ---------------------------------------------------------------
drop policy if exists org_select on organizations;
create policy org_select on organizations
  for select using (is_org_member(id) or owner_id = auth.uid());

drop policy if exists org_insert on organizations;
create policy org_insert on organizations
  for insert with check (owner_id = auth.uid());

drop policy if exists org_update on organizations;
create policy org_update on organizations
  for update using (is_org_admin(id)) with check (is_org_admin(id));

drop policy if exists org_delete on organizations;
create policy org_delete on organizations
  for delete using (owner_id = auth.uid());

-- org_members -----------------------------------------------------------------
drop policy if exists member_select on org_members;
create policy member_select on org_members
  for select using (user_id = auth.uid() or is_org_admin(org_id));

drop policy if exists member_write on org_members;
create policy member_write on org_members
  for all using (is_org_admin(org_id)) with check (is_org_admin(org_id));

-- Generic member-read / admin-write across business tables --------------------
-- cars
drop policy if exists cars_read  on cars;
create policy cars_read  on cars  for select using (is_org_member(org_id));
drop policy if exists cars_write on cars;
create policy cars_write on cars  for all using (is_org_admin(org_id)) with check (is_org_admin(org_id));

-- clients (staff can create/update clients, not just admins)
drop policy if exists clients_read  on clients;
create policy clients_read  on clients  for select using (is_org_member(org_id));
drop policy if exists clients_write on clients;
create policy clients_write on clients  for all using (is_org_member(org_id)) with check (is_org_member(org_id));

-- contracts (staff operate contracts)
drop policy if exists contracts_read  on contracts;
create policy contracts_read  on contracts  for select using (is_org_member(org_id));
drop policy if exists contracts_write on contracts;
create policy contracts_write on contracts  for all using (is_org_member(org_id)) with check (is_org_member(org_id));

-- checkout_logs
drop policy if exists checkout_read  on checkout_logs;
create policy checkout_read  on checkout_logs  for select using (is_org_member(org_id));
drop policy if exists checkout_write on checkout_logs;
create policy checkout_write on checkout_logs  for all using (is_org_member(org_id)) with check (is_org_member(org_id));

-- checkin_logs
drop policy if exists checkin_read  on checkin_logs;
create policy checkin_read  on checkin_logs  for select using (is_org_member(org_id));
drop policy if exists checkin_write on checkin_logs;
create policy checkin_write on checkin_logs  for all using (is_org_member(org_id)) with check (is_org_member(org_id));

-- complaints
drop policy if exists complaints_read  on complaints;
create policy complaints_read  on complaints  for select using (is_org_member(org_id));
drop policy if exists complaints_write on complaints;
create policy complaints_write on complaints  for all using (is_org_member(org_id)) with check (is_org_member(org_id));

-- ============================================================================
-- End of schema. Verify in Table Editor that RLS is "Enabled" on every table.
-- ============================================================================
