-- Real-user monitoring for the public chapter website.
-- Run once in the Supabase SQL editor (same project as app.etaomicron.org).
--
-- Visitors' browsers can only INSERT rows (small, size-checked). Nobody can read raw rows through
-- the API; signed-in brothers get aggregated numbers through rum_summary(), which the Brothers Only
-- "Site Health" panel calls. The service role (Command Center / Jarvis) can query the table directly.

create table if not exists public.rum_events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  session_id  text not null check (char_length(session_id) between 8 and 64),
  visitor_id  text check (char_length(visitor_id) <= 64),
  type        text not null check (type in ('page_view', 'vital', 'engagement', 'click', 'error')),
  path        text check (char_length(path) <= 300),
  name        text check (char_length(name) <= 300),
  value       double precision,
  rating      text check (rating is null or rating in ('good', 'needs-improvement', 'poor')),
  data        jsonb not null default '{}'::jsonb check (pg_column_size(data) <= 2048)
);

create index if not exists rum_events_created_at_idx on public.rum_events (created_at desc);
create index if not exists rum_events_type_created_idx on public.rum_events (type, created_at desc);
create index if not exists rum_events_session_idx on public.rum_events (session_id);

alter table public.rum_events enable row level security;

drop policy if exists "Visitors can submit monitoring events" on public.rum_events;
create policy "Visitors can submit monitoring events"
  on public.rum_events for insert
  to anon, authenticated
  with check (created_at > now() - interval '5 minutes' and created_at < now() + interval '5 minutes');

-- No select/update/delete policies: raw rows are not readable through the public API.
grant insert on public.rum_events to anon, authenticated;

-- Aggregated site health for the last N days.
create or replace function public.rum_summary(window_days int default 7)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with ev as (
    select * from rum_events
    where created_at >= now() - make_interval(days => least(greatest(window_days, 1), 90))
  ),
  sess as (
    select
      session_id,
      count(*) filter (where type = 'page_view') as views,
      coalesce(sum((data->>'visible_ms')::numeric) filter (where type = 'engagement'), 0) as visible_ms,
      coalesce(sum((data->>'interactions')::int) filter (where type = 'engagement'), 0) as interactions,
      count(*) filter (where type = 'click') as clicks
    from ev
    group by session_id
  ),
  vitals as (
    select
      name,
      percentile_cont(0.75) within group (order by value) as p75,
      avg((rating = 'good')::int) as good_share,
      count(*) as samples
    from ev
    where type = 'vital'
    group by name
  ),
  pages as (
    select path, count(*) as views
    from ev where type = 'page_view'
    group by path order by views desc limit 10
  ),
  page_time as (
    select path, round(avg((data->>'visible_ms')::numeric) / 1000, 1) as avg_seconds, round(avg((data->>'max_scroll')::numeric)) as avg_scroll
    from ev where type = 'engagement'
    group by path
  ),
  referrers as (
    select data->>'referrer' as referrer, count(*) as visits
    from ev where type = 'page_view' and data->>'nav_type' <> 'spa'
    group by 1 order by visits desc limit 8
  ),
  clicks as (
    select name, count(*) as clicks
    from ev where type = 'click' and name is not null
    group by name order by clicks desc limit 10
  ),
  daily as (
    select
      to_char(date_trunc('day', created_at at time zone 'America/New_York'), 'YYYY-MM-DD') as day,
      count(*) filter (where type = 'page_view') as views,
      count(distinct session_id) as sessions
    from ev
    group by 1 order by 1
  ),
  devices as (
    select data->>'device' as device, count(*) as views
    from ev where type = 'page_view'
    group by 1
  ),
  errors as (
    select name, count(*) as occurrences, max(created_at) as last_seen
    from ev where type = 'error'
    group by name order by occurrences desc limit 5
  )
  select jsonb_build_object(
    'window_days', least(greatest(window_days, 1), 90),
    'generated_at', now(),
    'sessions', (select count(*) from sess where views > 0),
    'visitors', (select count(distinct visitor_id) from ev),
    'page_views', (select count(*) from ev where type = 'page_view'),
    'pages_per_session', (select round(avg(views), 2) from sess where views > 0),
    -- A bounce: one page, under 10 seconds of visible time, and no clicks or key presses.
    'bounce_rate', (
      select round(avg(case when views = 1 and visible_ms < 10000 and interactions = 0 and clicks = 0 then 1 else 0 end), 3)
      from sess where views > 0
    ),
    'avg_engaged_seconds', (select round(avg(visible_ms) / 1000, 1) from sess where views > 0),
    'vitals', coalesce((select jsonb_object_agg(name, jsonb_build_object('p75', round(p75::numeric, 3), 'good_share', round(good_share, 3), 'samples', samples)) from vitals), '{}'::jsonb),
    'top_pages', coalesce((
      select jsonb_agg(jsonb_build_object('path', p.path, 'views', p.views, 'avg_seconds', t.avg_seconds, 'avg_scroll', t.avg_scroll) order by p.views desc)
      from pages p left join page_time t using (path)
    ), '[]'::jsonb),
    'referrers', coalesce((select jsonb_agg(r order by r.visits desc) from referrers r), '[]'::jsonb),
    'top_clicks', coalesce((select jsonb_agg(c order by c.clicks desc) from clicks c), '[]'::jsonb),
    'devices', coalesce((select jsonb_object_agg(coalesce(device, 'unknown'), views) from devices), '{}'::jsonb),
    'daily', coalesce((select jsonb_agg(d order by d.day) from daily d), '[]'::jsonb),
    'errors', coalesce((select jsonb_agg(e order by e.occurrences desc) from errors e), '[]'::jsonb)
  );
$$;

revoke all on function public.rum_summary(int) from public, anon;
grant execute on function public.rum_summary(int) to authenticated, service_role;

-- Optional: keep 90 days of raw events. Requires the pg_cron extension (Database > Extensions).
-- select cron.schedule('rum-retention', '15 4 * * *', $$delete from public.rum_events where created_at < now() - interval '90 days'$$);
