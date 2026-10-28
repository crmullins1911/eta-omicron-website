-- Editable website content: everything that used to be a placeholder in the code.
-- Run once in the Supabase SQL editor (same project as app.etaomicron.org). Safe to run again;
-- it never overwrites text you've already entered.
--
-- Where to edit (Supabase > Table Editor):
--   site_content        About Us history, Chapter House details, home page photos   (one row per item)
--   site_officers       Executive Committee on About Us                              (one row per officer)
--   committee_documents Forms and documents on each committee page                  (one row per document)
--   meeting_minutes     Meeting Minutes in Brothers Only (members only)              (one row per meeting)
-- Already live elsewhere: events come from the member app (events.on_website); Media from media_items.
--
-- Anyone can read the public tables; only officers (members.is_officer) can change them through the
-- website. Editing in the Supabase dashboard always works.

create or replace function public.is_officer()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select m.is_officer from public.members m where m.auth_user_id = auth.uid() limit 1),
    false);
$$;
revoke all on function public.is_officer() from public, anon;
grant execute on function public.is_officer() to authenticated, service_role;

-- Is the signed-in user on the chapter roster? (Used for Brothers Only content.)
create or replace function public.is_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.members m where m.auth_user_id = auth.uid());
$$;
revoke all on function public.is_member() from public, anon;
grant execute on function public.is_member() to authenticated, service_role;

-- ---------------------------------------------------------------------------------------------
-- 1. site_content: single pieces of text. Edit only the "value" column. Empty = not shown.
create table if not exists public.site_content (
  key        text primary key,
  value      text not null default '',
  label      text not null default '',
  help       text not null default '',
  sort_order int  not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.site_content (key, label, help, sort_order, value) values
  ('history', 'About Us: Chapter History',
   'The history text on About Us. Leave a blank line between paragraphs.', 10, ''),
  ('chapter_house_description', 'Chapter House: Intro',
   'Opening paragraph on the Chapter House page.', 20, ''),
  ('chapter_house_address', 'Chapter House: Address',
   'Street address. Press Enter for a new line.', 21, ''),
  ('chapter_house_map_url', 'Chapter House: Map link',
   'A Google Maps link to the address (adds a "Get directions" button).', 22, ''),
  ('chapter_house_hours', 'Chapter House: Hours',
   'One line per entry, days and time separated by " | ". Example: Saturdays | 10:00 AM – 2:00 PM', 23, ''),
  ('chapter_house_meetings', 'Chapter House: Chapter meetings',
   'Example: Chapter meetings are held on the first Saturday of each month.', 24, ''),
  ('chapter_house_rentals', 'Chapter House: Using the house',
   'Rental or community use details.', 25, ''),
  ('chapter_house_phone', 'Chapter House: Contact phone',
   'Phone number shown under Contact.', 26, ''),
  ('chapter_house_email', 'Chapter House: Contact email',
   'Email shown under Contact. Leave empty to use EtaOmicronQues@gmail.com.', 27, ''),
  ('home_feature_url', 'Home page: Big photo or video',
   'Link to the large photo or MP4 video band on the home page (a Media page link works).', 30, ''),
  ('home_feature_poster', 'Home page: Video still image',
   'Only for a video: link to a still photo shown before it plays.', 31, ''),
  ('home_feature_caption', 'Home page: Big photo caption',
   'Large line of text over the home page photo. Empty = "Brothers in service."', 32, ''),
  ('home_feature_alt', 'Home page: Big photo description',
   'Short description of the photo for screen readers.', 33, ''),
  ('home_news_photo_url', 'Home page: News photo',
   'Link to the photo beside Chapter News on the home page.', 34, ''),
  ('home_news_photo_alt', 'Home page: News photo description',
   'Short description of that photo.', 35, '')
on conflict (key) do update
  set label = excluded.label, help = excluded.help, sort_order = excluded.sort_order; -- keeps your value

-- ---------------------------------------------------------------------------------------------
-- 2. site_officers: Executive Committee. Rows with an empty name are not shown.
create table if not exists public.site_officers (
  id         bigint generated always as identity primary key,
  sort_order int  not null default 0,
  role       text not null,
  name       text not null default '',
  bio        text not null default '',
  photo_url  text not null default '',
  created_at timestamptz not null default now()
);

insert into public.site_officers (sort_order, role)
select v.sort_order, v.role
from (values (1, 'Basileus'), (2, 'Vice Basileus'), (3, 'Keeper of Records and Seal'),
             (4, 'Keeper of Finance'), (5, 'Chaplain'), (6, 'Keeper of Peace')) as v(sort_order, role)
where not exists (select 1 from public.site_officers);

-- ---------------------------------------------------------------------------------------------
-- 3. committee_documents: one row per form/document. committee_slug is the end of the page
--    address, e.g. talent-hunt for /committees/talent-hunt.
create table if not exists public.committee_documents (
  id             bigint generated always as identity primary key,
  committee_slug text not null,
  title          text not null,
  file_url       text not null,
  category       text,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------------------------
-- 4. meeting_minutes: Brothers Only. file_url can be a Google Drive or Supabase Storage link.
create table if not exists public.meeting_minutes (
  id           bigint generated always as identity primary key,
  meeting_date date not null,
  title        text not null default 'Chapter Meeting',
  summary      text not null default '',
  file_url     text not null default '',
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------------------------
-- Access rules
alter table public.site_content        enable row level security;
alter table public.site_officers       enable row level security;
alter table public.committee_documents enable row level security;
alter table public.meeting_minutes     enable row level security;

do $$
declare t text;
begin
  foreach t in array array['site_content', 'site_officers', 'committee_documents'] loop
    execute format('drop policy if exists "Anyone can read" on public.%I', t);
    execute format('create policy "Anyone can read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('grant select on public.%I to anon, authenticated', t);
  end loop;

  foreach t in array array['site_content', 'site_officers', 'committee_documents', 'meeting_minutes'] loop
    execute format('drop policy if exists "Officers can edit" on public.%I', t);
    execute format('create policy "Officers can edit" on public.%I for all to authenticated
                    using (public.is_officer()) with check (public.is_officer())', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
  end loop;
end
$$;

drop policy if exists "Members can read" on public.meeting_minutes;
create policy "Members can read" on public.meeting_minutes
  for select to authenticated
  using (public.is_member());
grant select on public.meeting_minutes to authenticated;
