-- Phase 3: extra vehicle fields. reg_number/make/model/capacity/status/county
-- already exist on `cars`; this adds colour, daily rate and free-text notes.
-- Run in the Supabase SQL editor (idempotent).

alter table cars add column if not exists color        text;
alter table cars add column if not exists rate_per_day numeric(12,2);
alter table cars add column if not exists notes        text;

notify pgrst, 'reload schema';
