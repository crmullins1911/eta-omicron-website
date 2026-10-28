-- Officer photo/video uploads from Brothers Only.
-- Run once in the Supabase SQL editor (same project as app.etaomicron.org). Safe to run again.
--
-- Officers (members.is_officer) can upload to the "media" storage bucket and add/remove rows in
-- media_items. Everyone can still view the Media page. Other brothers and visitors can't upload.

-- Officer check (same as in 20261028_site_health_officers_only.sql; repeated so this file stands alone).
create or replace function public.is_officer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select m.is_officer from public.members m where m.auth_user_id = auth.uid() limit 1),
    false
  );
$$;
revoke all on function public.is_officer() from public, anon;
grant execute on function public.is_officer() to authenticated, service_role;

-- 1. Media table. Created if it doesn't exist yet; otherwise just gains the two new columns.
create table if not exists public.media_items (
  created_at timestamptz not null default now(),
  title      text not null,
  type       text not null check (type in ('image', 'video')),
  url        text not null
);
alter table public.media_items add column if not exists storage_path text; -- file in the "media" bucket, for removal
alter table public.media_items add column if not exists uploaded_by uuid default auth.uid();
alter table public.media_items enable row level security;

-- Remove any older write rules on media_items (from the first setup script) so officers are the
-- only ones who can add, change or remove media. Read access is re-added just below.
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'media_items'
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
      and policyname not in ('Media: officers can add', 'Media: officers can remove')
  loop
    execute format('drop policy %I on public.media_items', p.policyname);
  end loop;
end
$$;

drop policy if exists "Media: anyone can view" on public.media_items;
create policy "Media: anyone can view"
  on public.media_items for select
  to anon, authenticated
  using (true);

drop policy if exists "Media: officers can add" on public.media_items;
create policy "Media: officers can add"
  on public.media_items for insert
  to authenticated
  with check (public.is_officer());

drop policy if exists "Media: officers can remove" on public.media_items;
create policy "Media: officers can remove"
  on public.media_items for delete
  to authenticated
  using (public.is_officer());

grant select on public.media_items to anon, authenticated;
grant insert, delete on public.media_items to authenticated;

-- 2. Storage bucket: public so the Media page can show files; 50 MB per file.
insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 52428800)
on conflict (id) do update
  set public = true,
      file_size_limit = coalesce(storage.buckets.file_size_limit, excluded.file_size_limit);

drop policy if exists "Media bucket: officers can upload" on storage.objects;
create policy "Media bucket: officers can upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media' and public.is_officer());

drop policy if exists "Media bucket: officers can remove" on storage.objects;
create policy "Media bucket: officers can remove"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and public.is_officer());
