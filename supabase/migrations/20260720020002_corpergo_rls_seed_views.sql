-- =============================================================================
-- CorpErgo — Seed data, RLS, storage policies, admin views
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 7. SEED DATA
-- ---------------------------------------------------------------------------

insert into public.clinics (name, slug, address, city, state)
values
  ('Channasandra', 'chansandra', 'Kadugodi, Whitefield, Bengaluru', 'Bengaluru', 'Karnataka'),
  ('Balagere', 'balagere', 'Varthur, Bengaluru', 'Bengaluru', 'Karnataka'),
  ('Muthsandra', 'muthsandra', 'Madhura Nagar, Varthur, Bengaluru', 'Bengaluru', 'Karnataka'),
  ('Kannamangala', 'kannamangala', 'Whitefield–Hoskote Road, Bengaluru', 'Bengaluru', 'Karnataka'),
  ('Manduru', 'manduru', 'Budigere Old Madras Road, Bengaluru', 'Bengaluru', 'Karnataka')
on conflict (slug) do nothing;

insert into public.physiotherapy_categories (name, slug, description, sort_order)
values
  ('Orthopaedic', 'orthopaedic', 'Bones, joints, and post-fracture rehab', 1),
  ('Neurological', 'neurological', 'Stroke, Parkinson''s, nerve-related rehab', 2),
  ('Musculoskeletal', 'musculoskeletal', 'Back, neck, soft-tissue conditions', 3),
  ('Sports Rehab', 'sports-rehab', 'Sports injuries and return-to-play', 4),
  ('Pediatric', 'pediatric', 'Children''s physiotherapy', 5),
  ('Women''s Health', 'womens-health', 'Prenatal, postnatal, pelvic health', 6),
  ('Geriatric', 'geriatric', 'Elderly mobility and fall prevention', 7),
  ('Post Surgery', 'post-surgery', 'Post-operative rehabilitation', 8),
  ('Other', 'other', 'Something else or not sure yet', 9)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- 8. RLS POLICIES
-- ---------------------------------------------------------------------------

alter table public.clinics enable row level security;
alter table public.profiles enable row level security;
alter table public.physiotherapy_categories enable row level security;
alter table public.physiotherapists enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.assessments enable row level security;
alter table public.follow_up_sessions enable row level security;
alter table public.qr_tickets enable row level security;
alter table public.clinic_slots enable row level security;
alter table public.notifications enable row level security;
alter table public.documents enable row level security;

-- Clinics: public read active; admin manage
create policy clinics_public_read
  on public.clinics for select
  using (deleted_at is null and (is_active = true or public.is_admin_level()));

create policy clinics_admin_write
  on public.clinics for all
  using (public.is_admin_level())
  with check (public.is_admin_level());

-- Categories: public read
create policy categories_public_read
  on public.physiotherapy_categories for select
  using (deleted_at is null and (is_active = true or public.is_admin_level()));

create policy categories_admin_write
  on public.physiotherapy_categories for all
  using (public.is_admin_level())
  with check (public.is_admin_level());

-- Profiles
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
    )
  );

create policy profiles_update_own
  on public.profiles for update
  using (id = auth.uid() or public.is_admin_level())
  with check (
    (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()))
    or public.is_admin_level()
  );

create policy profiles_admin_insert
  on public.profiles for insert
  with check (id = auth.uid() or public.is_admin_level());

-- Physiotherapists
create policy physiotherapists_read
  on public.physiotherapists for select
  using (
    deleted_at is null
    and (
      is_active = true
      or user_id = auth.uid()
      or public.is_admin_level()
      or clinic_id = public.current_staff_clinic_id()
    )
  );

create policy physiotherapists_admin_write
  on public.physiotherapists for all
  using (public.is_admin_level())
  with check (public.is_admin_level());

create policy physiotherapists_self_update
  on public.physiotherapists for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Patients: own record; clinic staff for their clinic's patients; admin all
create policy patients_select
  on public.patients for select
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
  );

create policy patients_insert_own
  on public.patients for insert
  with check (user_id = auth.uid() or public.is_admin_level());

create policy patients_update_own
  on public.patients for update
  using (user_id = auth.uid() or public.is_admin_level())
  with check (user_id = auth.uid() or public.is_admin_level());

-- Appointments
create policy appointments_select
  on public.appointments for select
  using (
    deleted_at is null
    and (
      patient_id = public.current_patient_id()
      or clinic_id = public.current_staff_clinic_id()
      or public.is_admin_level()
    )
  );

-- Patients create appointments only for themselves, always pending
create policy appointments_patient_insert
  on public.appointments for insert
  with check (
    (
      patient_id = public.current_patient_id()
      and status = 'pending'
      and physiotherapist_id is null
    )
    or public.is_admin_level()
  );

-- Patients may cancel their own pending/accepted; staff/admin manage clinic appointments
create policy appointments_update
  on public.appointments for update
  using (
    deleted_at is null
    and (
      public.is_admin_level()
      or clinic_id = public.current_staff_clinic_id()
      or (
        patient_id = public.current_patient_id()
        and status in ('pending', 'accepted')
      )
    )
  )
  with check (
    public.is_admin_level()
    or clinic_id = public.current_staff_clinic_id()
    or (
      patient_id = public.current_patient_id()
      and status = 'cancelled'
    )
  );

-- Assessments: clinic staff write; patient read own
create policy assessments_select
  on public.assessments for select
  using (
    deleted_at is null
    and (
      public.is_admin_level()
      or exists (
        select 1 from public.appointments a
        where a.id = assessments.appointment_id
          and a.deleted_at is null
          and (
            a.patient_id = public.current_patient_id()
            or a.clinic_id = public.current_staff_clinic_id()
          )
      )
    )
  );

create policy assessments_staff_insert
  on public.assessments for insert
  with check (
    public.is_admin_level()
    or exists (
      select 1 from public.appointments a
      where a.id = appointment_id
        and a.clinic_id = public.current_staff_clinic_id()
        and a.status in ('checked_in', 'completed', 'accepted')
    )
  );

create policy assessments_staff_update
  on public.assessments for update
  using (
    public.is_admin_level()
    or exists (
      select 1 from public.appointments a
      where a.id = assessments.appointment_id
        and a.clinic_id = public.current_staff_clinic_id()
    )
  )
  with check (
    public.is_admin_level()
    or exists (
      select 1 from public.appointments a
      where a.id = assessments.appointment_id
        and a.clinic_id = public.current_staff_clinic_id()
    )
  );

-- Follow-ups
create policy follow_ups_select
  on public.follow_up_sessions for select
  using (
    deleted_at is null
    and (
      patient_id = public.current_patient_id()
      or clinic_id = public.current_staff_clinic_id()
      or public.is_admin_level()
    )
  );

create policy follow_ups_staff_write
  on public.follow_up_sessions for all
  using (
    public.is_admin_level()
    or clinic_id = public.current_staff_clinic_id()
  )
  with check (
    public.is_admin_level()
    or clinic_id = public.current_staff_clinic_id()
  );

-- QR tickets
create policy qr_tickets_select
  on public.qr_tickets for select
  using (
    deleted_at is null
    and (
      public.is_admin_level()
      or exists (
        select 1 from public.appointments a
        where a.id = qr_tickets.appointment_id
          and (
            a.patient_id = public.current_patient_id()
            or a.clinic_id = public.current_staff_clinic_id()
          )
      )
    )
  );

create policy qr_tickets_staff_update
  on public.qr_tickets for update
  using (
    public.is_admin_level()
    or exists (
      select 1 from public.appointments a
      where a.id = qr_tickets.appointment_id
        and a.clinic_id = public.current_staff_clinic_id()
    )
  )
  with check (
    public.is_admin_level()
    or exists (
      select 1 from public.appointments a
      where a.id = qr_tickets.appointment_id
        and a.clinic_id = public.current_staff_clinic_id()
    )
  );

-- Clinic slots
create policy clinic_slots_read
  on public.clinic_slots for select
  using (deleted_at is null and (is_available = true or public.is_admin_level() or clinic_id = public.current_staff_clinic_id()));

create policy clinic_slots_staff_write
  on public.clinic_slots for all
  using (
    public.is_admin_level()
    or clinic_id = public.current_staff_clinic_id()
  )
  with check (
    public.is_admin_level()
    or clinic_id = public.current_staff_clinic_id()
  );

-- Notifications
create policy notifications_select_own
  on public.notifications for select
  using (user_id = auth.uid() or public.is_admin_level());

create policy notifications_update_own
  on public.notifications for update
  using (user_id = auth.uid() or public.is_admin_level())
  with check (user_id = auth.uid() or public.is_admin_level());

create policy notifications_staff_insert
  on public.notifications for insert
  with check (
    public.is_admin_level()
    or public.has_role(array['clinic_manager', 'receptionist', 'physiotherapist']::public.app_role[])
    or user_id = auth.uid()
  );

-- Documents
create policy documents_select
  on public.documents for select
  using (
    deleted_at is null
    and (
      public.is_admin_level()
      or exists (
        select 1 from public.patients p
        where p.id = documents.patient_id and p.user_id = auth.uid()
      )
      or exists (
        select 1 from public.appointments a
        where a.id = documents.appointment_id
          and a.clinic_id = public.current_staff_clinic_id()
      )
    )
  );

create policy documents_insert
  on public.documents for insert
  with check (
    public.is_admin_level()
    or exists (
      select 1 from public.patients p
      where p.id = patient_id and p.user_id = auth.uid()
    )
    or public.has_role(array['clinic_manager', 'receptionist', 'physiotherapist']::public.app_role[])
  );

create policy documents_update
  on public.documents for update
  using (
    public.is_admin_level()
    or uploaded_by = auth.uid()
    or exists (
      select 1 from public.appointments a
      where a.id = documents.appointment_id
        and a.clinic_id = public.current_staff_clinic_id()
    )
  )
  with check (
    public.is_admin_level()
    or uploaded_by = auth.uid()
    or exists (
      select 1 from public.appointments a
      where a.id = documents.appointment_id
        and a.clinic_id = public.current_staff_clinic_id()
    )
  );

-- ---------------------------------------------------------------------------
-- 9. STORAGE
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'patient-documents',
    'patient-documents',
    false,
    20971520,
    array[
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic'
    ]
  ),
  (
    'assessment-images',
    'assessment-images',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
  )
on conflict (id) do nothing;

create policy storage_patient_documents_select
  on storage.objects for select
  using (
    bucket_id in ('patient-documents', 'assessment-images')
    and (
      public.is_admin_level()
      or (storage.foldername(name))[1] = auth.uid()::text
      or public.has_role(array['clinic_manager', 'receptionist', 'physiotherapist']::public.app_role[])
    )
  );

create policy storage_patient_documents_insert
  on storage.objects for insert
  with check (
    bucket_id in ('patient-documents', 'assessment-images')
    and (
      public.is_admin_level()
      or (storage.foldername(name))[1] = auth.uid()::text
      or public.has_role(array['clinic_manager', 'receptionist', 'physiotherapist']::public.app_role[])
    )
  );

create policy storage_patient_documents_update
  on storage.objects for update
  using (
    bucket_id in ('patient-documents', 'assessment-images')
    and (
      public.is_admin_level()
      or (storage.foldername(name))[1] = auth.uid()::text
      or public.has_role(array['clinic_manager', 'receptionist', 'physiotherapist']::public.app_role[])
    )
  );

create policy storage_patient_documents_delete
  on storage.objects for delete
  using (
    bucket_id in ('patient-documents', 'assessment-images')
    and (
      public.is_admin_level()
      or (storage.foldername(name))[1] = auth.uid()::text
    )
  );

-- ---------------------------------------------------------------------------
-- 10. VIEWS — Admin dashboard
-- ---------------------------------------------------------------------------

create or replace view public.v_admin_dashboard_kpis
with (security_invoker = true)
as
select
  count(*) filter (where preferred_date = current_date or scheduled_date = current_date)
    as todays_bookings,
  count(*) filter (where status = 'pending') as pending,
  count(*) filter (where status = 'accepted') as accepted,
  count(*) filter (where status = 'checked_in') as checked_in,
  count(*) filter (where status = 'completed') as completed,
  count(*) filter (where status = 'cancelled') as cancelled,
  count(*) filter (where status = 'rejected') as rejected,
  count(*) filter (where status = 'rescheduled') as rescheduled,
  count(*) filter (where created_at::date = current_date) as created_today
from public.appointments
where deleted_at is null;

comment on view public.v_admin_dashboard_kpis is
  'Org-wide appointment KPIs for the admin home dashboard.';

create or replace view public.v_admin_clinic_summary
with (security_invoker = true)
as
select
  c.id as clinic_id,
  c.name as clinic_name,
  c.slug,
  c.is_active,
  count(distinct ph.id) filter (where ph.deleted_at is null and ph.is_active) as active_physiotherapists,
  count(a.id) filter (where a.deleted_at is null and (a.preferred_date = current_date or a.scheduled_date = current_date)) as todays_appointments,
  count(a.id) filter (where a.deleted_at is null and a.status = 'pending') as pending,
  count(a.id) filter (where a.deleted_at is null and a.status = 'completed') as completed,
  count(a.id) filter (where a.deleted_at is null and a.status = 'cancelled') as cancelled,
  count(distinct a.patient_id) filter (where a.deleted_at is null) as total_patients_seen
from public.clinics c
left join public.physiotherapists ph on ph.clinic_id = c.id
left join public.appointments a on a.clinic_id = c.id
where c.deleted_at is null
group by c.id, c.name, c.slug, c.is_active
order by c.name;

comment on view public.v_admin_clinic_summary is
  'Per-clinic cards: patients, completed, cancelled, physio count.';

create or replace view public.v_admin_top_conditions
with (security_invoker = true)
as
select
  pc.id as category_id,
  pc.name as category_name,
  count(a.id) as appointment_count
from public.physiotherapy_categories pc
left join public.appointments a
  on a.category_id = pc.id
 and a.deleted_at is null
where pc.deleted_at is null
group by pc.id, pc.name
order by appointment_count desc, pc.name;

create or replace view public.v_admin_appointment_heatmap
with (security_invoker = true)
as
select
  extract(dow from coalesce(scheduled_date, preferred_date))::int as day_of_week,
  extract(hour from coalesce(scheduled_time, preferred_time))::int as hour_of_day,
  count(*) as booking_count
from public.appointments
where deleted_at is null
  and coalesce(scheduled_date, preferred_date) >= current_date - interval '90 days'
group by 1, 2
order by 1, 2;

create or replace view public.v_admin_physio_performance
with (security_invoker = true)
as
select
  ph.id as physiotherapist_id,
  pr.full_name,
  c.name as clinic_name,
  count(a.id) filter (where a.deleted_at is null) as total_appointments,
  count(a.id) filter (where a.status = 'completed' and a.deleted_at is null) as completed,
  count(a.id) filter (where a.status = 'cancelled' and a.deleted_at is null) as cancelled,
  round(
    100.0 * count(a.id) filter (where a.status = 'completed' and a.deleted_at is null)
    / nullif(count(a.id) filter (where a.deleted_at is null), 0),
    1
  ) as completion_pct,
  count(f.id) filter (where f.deleted_at is null) as follow_ups_scheduled
from public.physiotherapists ph
join public.profiles pr on pr.id = ph.user_id
join public.clinics c on c.id = ph.clinic_id
left join public.appointments a on a.physiotherapist_id = ph.id
left join public.follow_up_sessions f on f.physiotherapist_id = ph.id
where ph.deleted_at is null
group by ph.id, pr.full_name, c.name
order by completed desc nulls last;

create or replace view public.v_patient_timeline
with (security_invoker = true)
as
select
  a.patient_id,
  a.id as appointment_id,
  a.appointment_code,
  a.clinic_id,
  c.name as clinic_name,
  a.status,
  coalesce(a.scheduled_date, a.preferred_date) as visit_date,
  coalesce(a.scheduled_time, a.preferred_time) as visit_time,
  pc.name as category_name,
  ass.pain_score,
  ass.diagnosis,
  ass.treatment_given,
  a.created_at
from public.appointments a
join public.clinics c on c.id = a.clinic_id
join public.physiotherapy_categories pc on pc.id = a.category_id
left join public.assessments ass on ass.appointment_id = a.id and ass.deleted_at is null
where a.deleted_at is null
order by a.patient_id, visit_date, visit_time;

comment on view public.v_patient_timeline is
  'Visit history for progress comparison across sessions.';

grant select on public.v_admin_dashboard_kpis to authenticated;
grant select on public.v_admin_clinic_summary to authenticated;
grant select on public.v_admin_top_conditions to authenticated;
grant select on public.v_admin_appointment_heatmap to authenticated;
grant select on public.v_admin_physio_performance to authenticated;
grant select on public.v_patient_timeline to authenticated;
