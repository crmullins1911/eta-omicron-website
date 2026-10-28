-- Founders page portraits: four rows in site_content, one per founder. Paste an image link into
-- each row's "value" column (Supabase > Table Editor > site_content). Empty = monogram tile.
-- Requires 20261028_editable_site_content.sql. Run once in the Supabase SQL editor; safe to re-run.

insert into public.site_content (key, label, help, sort_order, value) values
  ('founder_love_photo',    'Founders: Edgar Amos Love photo',     'Link to a portrait image (tall photos look best).', 40, ''),
  ('founder_cooper_photo',  'Founders: Oscar James Cooper photo',  'Link to a portrait image (tall photos look best).', 41, ''),
  ('founder_coleman_photo', 'Founders: Frank Coleman photo',       'Link to a portrait image (tall photos look best).', 42, ''),
  ('founder_just_photo',    'Founders: Ernest Everett Just photo', 'Link to a portrait image (tall photos look best).', 43, '')
on conflict (key) do update
  set label = excluded.label, help = excluded.help, sort_order = excluded.sort_order; -- keeps your value
