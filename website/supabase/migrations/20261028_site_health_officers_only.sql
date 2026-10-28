-- Website Health is for chapter officers only.
-- Run once in the Supabase SQL editor, after 20261023_rum_events.sql. Safe to run again.
--
-- Before: any signed-in brother could call rum_summary().
-- After:  rum_summary() checks members.is_officer for the caller and refuses everyone else.
--         The service role (Command Center / Jarvis) still has full access.

-- 1. Is the signed-in user an officer? Used by the Brothers Only page to decide whether to
--    show the panel at all. Returns false (never an error) for non-officers and visitors.
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

-- Visitors (anon) must be able to call this too: the member app's events/members rules use it, and
-- it simply returns false for anyone not signed in.
grant execute on function public.is_officer() to anon, authenticated, service_role;

-- 2. Keep the existing summary query, unchanged, under a name only the service role can call.
do $$
begin
  if to_regprocedure('public.rum_summary_unrestricted(integer)') is null then
    alter function public.rum_summary(int) rename to rum_summary_unrestricted;
  end if;
end
$$;

revoke all on function public.rum_summary_unrestricted(int) from public, anon, authenticated;
grant execute on function public.rum_summary_unrestricted(int) to service_role;

-- 3. rum_summary() is now an officer-checked wrapper with the same name, arguments and output,
--    so the website and Command Center keep working without changes.
create or replace function public.rum_summary(window_days int default 7)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' and not public.is_officer() then
    raise exception 'Website Health is available to chapter officers only'
      using errcode = '42501'; -- insufficient_privilege
  end if;
  return public.rum_summary_unrestricted(window_days);
end;
$$;

revoke all on function public.rum_summary(int) from public, anon;
grant execute on function public.rum_summary(int) to authenticated, service_role;
