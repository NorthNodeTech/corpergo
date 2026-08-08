-- Assessment edit window: clinicians may edit for 24h after start; admin can unlock.
alter table public.assessments
  add column if not exists started_at timestamptz,
  add column if not exists admin_edit_unlocked boolean not null default false;

update public.assessments
set started_at = created_at
where started_at is null;

alter table public.assessments
  alter column started_at set default now();

create or replace function public.assessment_editable(a public.assessments)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    coalesce(a.admin_edit_unlocked, false)
    or a.started_at is null
    or now() < a.started_at + interval '24 hours';
$$;

drop policy if exists assessments_staff_update on public.assessments;

create policy assessments_staff_update
  on public.assessments for update
  using (
    public.is_admin_level()
    or (
      exists (
        select 1
        from public.appointments ap
        where ap.id = assessments.appointment_id
          and ap.clinic_id = public.current_staff_clinic_id()
      )
      and public.assessment_editable(assessments)
    )
  )
  with check (
    public.is_admin_level()
    or (
      exists (
        select 1
        from public.appointments ap
        where ap.id = assessments.appointment_id
          and ap.clinic_id = public.current_staff_clinic_id()
      )
      and public.assessment_editable(assessments)
    )
  );
