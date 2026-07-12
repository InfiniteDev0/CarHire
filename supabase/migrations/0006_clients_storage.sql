-- Phase 2B + Phase 4 plumbing: client KYC extras and private Storage buckets
-- for staff/client ID photos. Run in the Supabase SQL editor. Idempotent.

-- Client KYC extras (research spec: KRA pin, mandatory fallback phone)
alter table clients add column if not exists kra_pin         text;
alter table clients add column if not exists secondary_phone text;
alter table clients add column if not exists notes           text;

-- Private buckets. Object paths are always {org_id}/{record_id}/{file}.
insert into storage.buckets (id, name, public)
values ('staff-docs', 'staff-docs', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('client-docs', 'client-docs', false)
on conflict (id) do nothing;

-- Org members may read (=> can create signed URLs for) their org's documents.
-- Uploads happen server-side with the service role, which bypasses RLS.
drop policy if exists "staff docs member read" on storage.objects;
create policy "staff docs member read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'staff-docs'
    and is_org_member(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "client docs member read" on storage.objects;
create policy "client docs member read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'client-docs'
    and is_org_member(((storage.foldername(name))[1])::uuid)
  );

notify pgrst, 'reload schema';
