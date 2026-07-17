-- 0005_cars_recreate dropped the old cars table, which silently dropped every
-- FK pointing at it. Without these constraints PostgREST can't embed
-- cars(...) from contracts/complaints, so Rentals + Complaints render empty.
-- Idempotent: guarded against re-runs.

do $$ begin
  alter table contracts
    add constraint contracts_car_id_fkey
    foreign key (car_id) references cars(id) on delete restrict;
exception when duplicate_object then null; end $$;

do $$ begin
  alter table complaints
    add constraint complaints_car_id_fkey
    foreign key (car_id) references cars(id) on delete set null;
exception when duplicate_object then null; end $$;

notify pgrst, 'reload schema';
