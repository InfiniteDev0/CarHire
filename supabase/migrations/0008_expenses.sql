-- Expenses — the cost side of Finance. Optionally tied to a car so per-vehicle
-- profitability can be computed later. Idempotent.

do $$ begin
  create type expense_category as enum
    ('FUEL', 'MAINTENANCE', 'INSURANCE', 'REPAIRS', 'OTHER');
exception when duplicate_object then null; end $$;

create table if not exists expenses (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  car_id      uuid references cars(id) on delete set null,
  category    expense_category not null default 'OTHER',
  amount      numeric(12,2) not null check (amount >= 0),
  incurred_on date not null default current_date,
  note        text,
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_expenses_org on expenses(org_id, incurred_on desc);

drop trigger if exists trg_touch_expenses on expenses;
create trigger trg_touch_expenses before update on expenses
  for each row execute function touch_updated_at();

alter table expenses enable row level security;

-- Staff record and edit expenses; only admins can delete them.
drop policy if exists expenses_read on expenses;
create policy expenses_read on expenses for select using (is_org_member(org_id));

drop policy if exists expenses_insert on expenses;
create policy expenses_insert on expenses for insert with check (is_org_member(org_id));

drop policy if exists expenses_update on expenses;
create policy expenses_update on expenses for update using (is_org_member(org_id)) with check (is_org_member(org_id));

drop policy if exists expenses_delete on expenses;
create policy expenses_delete on expenses for delete using (is_org_admin(org_id));

notify pgrst, 'reload schema';
