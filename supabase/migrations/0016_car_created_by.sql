-- Who added each vehicle — attribution shown to admins and staff alike.
alter table cars add column if not exists created_by uuid references auth.users(id);

notify pgrst, 'reload schema';
