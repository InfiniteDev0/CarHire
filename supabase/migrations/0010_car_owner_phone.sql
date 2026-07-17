-- Owner contact for each car (name already exists as owner_name).
alter table cars add column if not exists owner_phone text;

notify pgrst, 'reload schema';
