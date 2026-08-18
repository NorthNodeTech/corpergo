-- Security hardening: ensure current_staff_clinic_id() strictly requires staff roles
-- and prevent patient profiles from setting clinic_id or physiotherapists from reassigning clinic_id.

create or replace function public.current_staff_clinic_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select clinic_id from public.physiotherapists where user_id = auth.uid() and deleted_at is null limit 1),
    (select clinic_id from public.profiles where id = auth.uid() and deleted_at is null and role in ('clinic_manager', 'receptionist', 'physiotherapist'))
  );
$$;

-- Hardened profiles update policy:
-- 1. Patients cannot assign or change clinic_id (clinic_id must remain null for patients).
-- 2. Non-admins cannot elevate their role.
drop policy if exists profiles_update_own on public.profiles;

create policy profiles_update_own
  on public.profiles for update
  using (id = auth.uid() or public.is_admin_level())
  with check (
    (
      id = auth.uid()
      and role = public.current_user_role()
      and (role in ('clinic_manager', 'receptionist', 'physiotherapist') or clinic_id is null)
    )
    or public.is_admin_level()
  );

-- Hardened physiotherapist self update policy:
-- Physiotherapists can update their bio, experience, specialization, license_number,
-- but cannot reassign their clinic_id (which is admin-managed).
drop policy if exists physiotherapists_self_update on public.physiotherapists;

create policy physiotherapists_self_update
  on public.physiotherapists for update
  using (user_id = auth.uid() or public.is_admin_level())
  with check (
    (
      user_id = auth.uid()
      and clinic_id = (
        select p.clinic_id
        from public.physiotherapists p
        where p.user_id = auth.uid()
          and p.deleted_at is null
        limit 1
      )
    )
    or public.is_admin_level()
  );
