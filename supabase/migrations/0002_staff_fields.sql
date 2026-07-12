-- Phase 2: staff profile fields stored on the membership row.
-- Run in the Supabase SQL editor (idempotent). `email`/`full_name` are
-- denormalised from auth.users so the staff list renders without touching the
-- auth schema. id_* columns are used by the ID-photo follow-up.

alter table org_members add column if not exists full_name    text;
alter table org_members add column if not exists email        text;
alter table org_members add column if not exists phone        text;
alter table org_members add column if not exists id_front_url text;
alter table org_members add column if not exists id_back_url  text;

notify pgrst, 'reload schema';
