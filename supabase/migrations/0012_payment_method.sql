-- How the client paid — staff pick it when recording money in.
do $$ begin
  create type payment_method as enum ('CASH', 'MPESA', 'BANK', 'OTHER');
exception when duplicate_object then null; end $$;

alter table payments add column if not exists method payment_method not null default 'CASH';

notify pgrst, 'reload schema';
