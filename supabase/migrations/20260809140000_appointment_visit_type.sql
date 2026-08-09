-- Returning patients: distinguish initial vs follow-up visits on the same profile.

alter table public.appointments
  add column if not exists visit_type text not null default 'initial'
    check (visit_type in ('initial', 'follow_up')),
  add column if not exists parent_appointment_id uuid references public.appointments (id) on delete set null;

create index if not exists appointments_patient_visit_type_idx
  on public.appointments (patient_id, visit_type)
  where deleted_at is null;

comment on column public.appointments.visit_type is
  'initial = first/new assessment session; follow_up = returning patient visit on same profile.';
comment on column public.appointments.parent_appointment_id is
  'When visit_type is follow_up, links to the prior completed visit this session continues from.';
