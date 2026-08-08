grant execute on function public.current_role() to anon, authenticated;
grant execute on function public.has_role(public.app_role[]) to anon, authenticated;
grant execute on function public.is_admin_level() to anon, authenticated;
grant execute on function public.current_staff_clinic_id() to anon, authenticated;
grant execute on function public.current_patient_id() to anon, authenticated;

drop policy if exists clinics_public_read on public.clinics;
drop policy if exists clinics_admin_write on public.clinics;

create policy clinics_anon_read_active
  on public.clinics for select
  to anon
  using (deleted_at is null and is_active = true);

create policy clinics_authenticated_read_active_or_admin
  on public.clinics for select
  to authenticated
  using (deleted_at is null and (is_active = true or public.is_admin_level()));

create policy clinics_admin_write
  on public.clinics for all
  to authenticated
  using (public.is_admin_level())
  with check (public.is_admin_level());

drop policy if exists categories_public_read on public.physiotherapy_categories;
drop policy if exists categories_admin_write on public.physiotherapy_categories;

create policy categories_anon_read_active
  on public.physiotherapy_categories for select
  to anon
  using (deleted_at is null and is_active = true);

create policy categories_authenticated_read_active_or_admin
  on public.physiotherapy_categories for select
  to authenticated
  using (deleted_at is null and (is_active = true or public.is_admin_level()));

create policy categories_admin_write
  on public.physiotherapy_categories for all
  to authenticated
  using (public.is_admin_level())
  with check (public.is_admin_level());
