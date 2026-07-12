-- Onboarding collects a few more org details than the base schema had.
-- Run this in the Supabase SQL editor (safe / idempotent) if you already ran
-- schema.sql before this migration existed.

alter table organizations add column if not exists county     text;
alter table organizations add column if not exists phone      text;
alter table organizations add column if not exists fleet_size text;  -- bucket: '1-5' | '6-20' | '21-50' | '50+'
