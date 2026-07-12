-- Phase 3 (expanded): full vehicle detail fields used by the details sheet,
-- add/edit form and filters. All nullable. Run in the Supabase SQL editor.

alter table cars add column if not exists year             int;
alter table cars add column if not exists body_type        text;   -- Sedan / SUV / Hatchback…
alter table cars add column if not exists transmission     text;   -- Automatic / Manual
alter table cars add column if not exists fuel_type        text;   -- Petrol / Diesel / Electric…
alter table cars add column if not exists engine           text;   -- free text, e.g. "2.0L Turbo (249 hp)"
alter table cars add column if not exists mileage          int;    -- odometer, km
alter table cars add column if not exists domicile         text;   -- home base, e.g. "Nairobi Base"
alter table cars add column if not exists image_url        text;   -- optional photo (uploads later)
alter table cars add column if not exists owner_name       text;   -- optional
alter table cars add column if not exists num_owners       int;    -- optional
alter table cars add column if not exists insurance_expiry date;   -- documents tab
alter table cars add column if not exists inspection_status text;  -- Compliant / Due / Expired


notify pgrst, 'reload schema';
