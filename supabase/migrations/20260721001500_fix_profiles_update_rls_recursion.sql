-- Fix infinite recursion on profiles UPDATE.
-- Cause: profiles_update_own WITH CHECK selected role from public.profiles,
-- which re-evaluated RLS on the same table.

create or replace function public.current_user_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and deleted_at is null;
$$;

grant execute on function public.current_user_role() to authenticated;

drop policy if exists profiles_update_own on public.profiles;

create policy profiles_update_own
  on public.profiles for update
  using (id = auth.uid() or public.is_admin_level())
  with check (
    (id = auth.uid() and role = public.current_user_role())
    or public.is_admin_level()
  );
