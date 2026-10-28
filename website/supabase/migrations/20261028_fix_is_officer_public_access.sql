-- Fix: the public website couldn't read events (error "permission denied for function is_officer").
-- The member app's rules on events and members call public.is_officer(). Earlier website setup
-- scripts blocked visitors (anon) from calling it, which broke those rules for the public site.
-- is_officer() returns false for anyone who isn't a signed-in officer, so it is safe to allow.
-- Run once in the Supabase SQL editor. Safe to run again.

grant execute on function public.is_officer() to anon, authenticated, service_role;

do $$
begin
  if to_regprocedure('public.is_member()') is not null then
    grant execute on function public.is_member() to anon, authenticated, service_role;
  end if;
end
$$;
