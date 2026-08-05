-- 0020_concurrent_rentals_driver_kyc.sql
-- Admins can opt in to letting a client hold more than one rental at a time,
-- capped by max_concurrent_rentals. When they do, each concurrent rental needs
-- its own designated driver (the client can't drive two cars), so contracts
-- carry that driver's ID + one document (front/back). Idempotent.

alter table organizations add column if not exists allow_multiple_rentals boolean not null default false;
alter table organizations add column if not exists max_concurrent_rentals int not null default 1;

alter table contracts add column if not exists driver_id_number text;
alter table contracts add column if not exists driver_doc_type text;   -- 'ID' | 'DL' | 'PASSPORT'
alter table contracts add column if not exists driver_doc_front_url text;
alter table contracts add column if not exists driver_doc_back_url text;

notify pgrst, 'reload schema';
