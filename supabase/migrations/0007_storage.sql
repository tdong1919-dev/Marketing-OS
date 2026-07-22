-- ───────────────────────────────────────────────────────────────
-- BrkFree — Storage bucket for uploaded assets
-- Private bucket. Objects are stored under `${auth.uid}/...` and each
-- user may only access their own top-level folder.
-- ───────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('assets', 'assets', false)
on conflict (id) do nothing;

drop policy if exists "assets_owner_read" on storage.objects;
drop policy if exists "assets_owner_insert" on storage.objects;
drop policy if exists "assets_owner_update" on storage.objects;
drop policy if exists "assets_owner_delete" on storage.objects;

create policy "assets_owner_read" on storage.objects
  for select using (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "assets_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "assets_owner_update" on storage.objects
  for update using (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "assets_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
