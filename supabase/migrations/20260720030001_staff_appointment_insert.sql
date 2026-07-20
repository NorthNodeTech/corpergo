-- Allow clinic staff to create appointments (follow-ups) for their clinic
drop policy if exists appointments_patient_insert on public.appointments;

create policy appointments_insert
  on public.appointments for insert
  with check (
    public.is_admin_level()
    or (
      patient_id = public.current_patient_id()
      and status = 'pending'
      and physiotherapist_id is null
    )
    or (
      clinic_id = public.current_staff_clinic_id()
      and public.has_role(array['clinic_manager', 'receptionist', 'physiotherapist']::public.app_role[])
    )
  );
