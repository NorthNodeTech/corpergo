-- Structured patient intake fields for registration / pre-appointment chart
alter table public.patients
  add column if not exists previous_surgeries text,
  add column if not exists medical_conditions jsonb not null default '{}'::jsonb,
  add column if not exists medicine_allergies text,
  add column if not exists food_allergies text,
  add column if not exists other_allergies text,
  add column if not exists other_medical_conditions text;

comment on column public.patients.medical_conditions is
  'Boolean flags: diabetes, hypertension, heart_disease, thyroid, arthritis, asthma, neurological';

drop policy if exists patients_update_own on public.patients;

create policy patients_update
  on public.patients for update
  using (
    deleted_at is null
    and (
      user_id = auth.uid()
      or public.is_admin_level()
      or exists (
        select 1
        from public.appointments a
        where a.patient_id = patients.id
          and a.deleted_at is null
          and a.clinic_id = public.current_staff_clinic_id()
      )
    )
  )
  with check (
    user_id = auth.uid()
    or public.is_admin_level()
    or exists (
      select 1
      from public.appointments a
      where a.patient_id = patients.id
        and a.deleted_at is null
        and a.clinic_id = public.current_staff_clinic_id()
    )
  );

drop policy if exists profiles_select_own_or_staff on public.profiles;

create policy profiles_select_own_or_staff
  on public.profiles for select
  using (
    deleted_at is null
    and (
      id = auth.uid()
      or public.is_admin_level()
      or (
        public.has_role(array['clinic_manager', 'receptionist', 'physiotherapist']::public.app_role[])
        and clinic_id = public.current_staff_clinic_id()
      )
      or exists (
        select 1
        from public.patients p
        join public.appointments a on a.patient_id = p.id
        where p.user_id = profiles.id
          and p.deleted_at is null
          and a.deleted_at is null
          and a.clinic_id = public.current_staff_clinic_id()
      )
    )
  );
