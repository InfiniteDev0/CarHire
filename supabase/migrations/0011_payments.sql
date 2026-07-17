-- Payments ledger — one row per money-in event, so Finance can chart
-- collections over time. contracts.amount_paid stays the running total.

do $$ begin
  create type payment_kind as enum ('DEPOSIT', 'PAYMENT', 'EXTENSION');
exception when duplicate_object then null; end $$;

create table if not exists payments (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references organizations(id) on delete cascade,
  contract_id uuid not null references contracts(id) on delete cascade,
  amount      numeric(12,2) not null check (amount > 0),
  kind        payment_kind not null default 'PAYMENT',
  recorded_by uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

create index if not exists idx_payments_org on payments(org_id, created_at desc);

alter table payments enable row level security;
drop policy if exists payments_read on payments;
create policy payments_read on payments for select using (is_org_member(org_id));
drop policy if exists payments_write on payments;
create policy payments_write on payments for all using (is_org_member(org_id)) with check (is_org_member(org_id));

-- Backfill: one synthetic row per already-paid contract (dated at creation)
-- so history isn't empty. Idempotent via the not-exists guard.
insert into payments (org_id, contract_id, amount, kind, created_at)
select c.org_id, c.id, c.amount_paid, 'PAYMENT', c.created_at
from contracts c
where c.amount_paid > 0
  and not exists (select 1 from payments p where p.contract_id = c.id);

notify pgrst, 'reload schema';
