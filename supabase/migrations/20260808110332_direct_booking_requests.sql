-- Direct booking requests: fast anonymous intake, staff call-back workflow,
-- and staff-only conversion into a real patient account + appointment.

alter table public.patients
  add column if not exists age_years integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'patients_age_years_range'
      and conrelid = 'public.patients'::regclass
  ) then
    alter table public.patients
      add constraint patients_age_years_range
      check (age_years is null or (age_years >= 0 and age_years <= 120));
  end if;
end $$;

create table if not exists public.direct_booking_requests (
  id uuid primary key default gen_random_uuid(),
  request_code text not null,
  clinic_id uuid not null references public.clinics (id) on delete restrict,
  full_name text not null,
  phone text not null,
  gender public.gender_type not null,
  age_years integer not null,
  status text not null default 'new',
  staff_notes text,
  contacted_at timestamptz,
  ready_at timestamptz,
  converted_at timestamptz,
  converted_by uuid references public.profiles (id) on delete set null,
  patient_user_id uuid references public.profiles (id) on delete set null,
  patient_id uuid references public.patients (id) on delete set null,
  appointment_id uuid references public.appointments (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint direct_booking_requests_code_unique unique (request_code),
  constraint direct_booking_requests_name_not_blank check (length(trim(full_name)) > 0),
  constraint direct_booking_requests_phone_not_blank check (length(trim(phone)) >= 8),
  constraint direct_booking_requests_age_range check (age_years >= 0 and age_years <= 120),
  constraint direct_booking_requests_status_check check (
    status in ('new', 'called', 'ready_for_session', 'converted', 'closed')
  ),
  constraint direct_booking_requests_one_appointment unique (appointment_id)
);

comment on table public.direct_booking_requests is
  'Anonymous, low-friction booking requests. Staff call patients and convert only when the patient is ready for the session.';

create index if not exists direct_booking_requests_clinic_status_idx
  on public.direct_booking_requests (clinic_id, status, created_at desc)
  where deleted_at is null;

create index if not exists direct_booking_requests_phone_idx
  on public.direct_booking_requests (phone)
  where deleted_at is null;

create index if not exists direct_booking_requests_patient_id_idx
  on public.direct_booking_requests (patient_id)
  where deleted_at is null;

create or replace function public.generate_direct_booking_code()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  if new.request_code is null or new.request_code = '' then
    new.request_code :=
      'DB-' || to_char(timezone('Asia/Kolkata', now()), 'YYYYMMDD') || '-' ||
      upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  end if;
  return new;
end;
$$;

drop trigger if exists direct_booking_requests_generate_code on public.direct_booking_requests;
create trigger direct_booking_requests_generate_code
  before insert on public.direct_booking_requests
  for each row execute function public.generate_direct_booking_code();

drop trigger if exists direct_booking_requests_set_updated_at on public.direct_booking_requests;
create trigger direct_booking_requests_set_updated_at
  before update on public.direct_booking_requests
  for each row execute function public.set_updated_at();

alter table public.direct_booking_requests enable row level security;

drop policy if exists direct_booking_requests_anon_insert on public.direct_booking_requests;
create policy direct_booking_requests_anon_insert
  on public.direct_booking_requests for insert
  to anon
  with check (
    request_code like 'DB-%'
    and status = 'new'
    and deleted_at is null
    and converted_at is null
    and converted_by is null
    and patient_user_id is null
    and patient_id is null
    and appointment_id is null
  );

drop policy if exists direct_booking_requests_staff_select on public.direct_booking_requests;
create policy direct_booking_requests_staff_select
  on public.direct_booking_requests for select
  to authenticated
  using (
    deleted_at is null
    and (
      (select public.is_admin_level())
      or clinic_id = (select public.current_staff_clinic_id())
    )
  );

drop policy if exists direct_booking_requests_staff_update on public.direct_booking_requests;
create policy direct_booking_requests_staff_update
  on public.direct_booking_requests for update
  to authenticated
  using (
    deleted_at is null
    and status <> 'converted'
    and (
      (select public.is_admin_level())
      or clinic_id = (select public.current_staff_clinic_id())
    )
  )
  with check (
    deleted_at is null
    and (
      (select public.is_admin_level())
      or clinic_id = (select public.current_staff_clinic_id())
    )
  );

revoke all on public.direct_booking_requests from anon, authenticated;
grant insert on public.direct_booking_requests to anon;
grant select on public.direct_booking_requests to authenticated;
grant update (status, staff_notes, contacted_at, ready_at) on public.direct_booking_requests to authenticated;

create schema if not exists private;
revoke all on schema private from public;

create or replace function private.create_patient_account_from_direct_request(
  p_request_id uuid,
  p_email text,
  p_password text,
  p_category_id uuid default null,
  p_scheduled_date date default null,
  p_scheduled_time time default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_staff_id uuid := auth.uid();
  v_staff_role public.app_role;
  v_staff_clinic_id uuid;
  v_req public.direct_booking_requests%rowtype;
  v_email text := lower(trim(coalesce(p_email, '')));
  v_now timestamptz := timezone('utc', now());
  v_user_id uuid := extensions.gen_random_uuid();
  v_patient_id uuid;
  v_category_id uuid;
  v_physio_id uuid;
  v_visit_date date;
  v_visit_time time;
  v_meta jsonb;
  v_appt public.appointments%rowtype;
begin
  if v_staff_id is null then
    raise exception 'Not signed in';
  end if;

  select
    pr.role,
    coalesce(pr.clinic_id, ph.clinic_id)
  into v_staff_role, v_staff_clinic_id
  from public.profiles pr
  left join public.physiotherapists ph
    on ph.user_id = pr.id
   and ph.deleted_at is null
  where pr.id = v_staff_id
    and pr.deleted_at is null
  limit 1;

  if v_staff_role is null
     or v_staff_role not in ('super_admin', 'admin', 'clinic_manager', 'receptionist', 'physiotherapist') then
    raise exception 'Only clinic staff can create accounts for direct bookings';
  end if;

  select *
  into v_req
  from public.direct_booking_requests
  where id = p_request_id
    and deleted_at is null
  for update;

  if not found then
    raise exception 'Direct booking request not found';
  end if;

  if v_req.status = 'converted' or v_req.patient_id is not null or v_req.appointment_id is not null then
    raise exception 'This direct booking request has already been converted';
  end if;

  if v_staff_role not in ('super_admin', 'admin')
     and v_req.clinic_id is distinct from v_staff_clinic_id then
    raise exception 'This direct booking belongs to another clinic';
  end if;

  if position('@' in v_email) < 2 or position('.' in split_part(v_email, '@', 2)) < 2 then
    raise exception 'Enter a valid email/login id';
  end if;

  if length(coalesce(p_password, '')) < 6 then
    raise exception 'Password must be at least 6 characters';
  end if;

  if exists (
    select 1
    from auth.users
    where lower(email) = v_email
      and deleted_at is null
  ) then
    raise exception 'An account already exists with this email/login id';
  end if;

  select coalesce(
    p_category_id,
    (select id from public.physiotherapy_categories where slug = 'other' and deleted_at is null limit 1),
    (select id from public.physiotherapy_categories where deleted_at is null and is_active order by sort_order asc limit 1)
  )
  into v_category_id;

  if v_category_id is null then
    raise exception 'No physiotherapy category is available';
  end if;

  if p_category_id is not null and not exists (
    select 1
    from public.physiotherapy_categories
    where id = p_category_id
      and deleted_at is null
  ) then
    raise exception 'Selected category is not available';
  end if;

  select id
  into v_physio_id
  from public.physiotherapists
  where user_id = v_staff_id
    and clinic_id = v_req.clinic_id
    and deleted_at is null
  limit 1;

  v_visit_date := coalesce(p_scheduled_date, (timezone('Asia/Kolkata', v_now))::date);
  v_visit_time := coalesce(p_scheduled_time, to_char(timezone('Asia/Kolkata', v_now), 'HH24:MI')::time);

  v_meta := jsonb_build_object(
    'sub', v_user_id::text,
    'role', 'patient',
    'email', v_email,
    'phone', v_req.phone,
    'full_name', v_req.full_name,
    'email_verified', true,
    'phone_verified', false,
    'created_from', 'direct_booking',
    'direct_booking_request_id', v_req.id::text
  );

  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_sso_user,
    is_anonymous
  )
  values (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    v_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    v_now,
    '{"provider":"email","providers":["email"]}'::jsonb,
    v_meta,
    v_now,
    v_now,
    false,
    false
  );

  insert into auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values (
    v_user_id::text,
    v_user_id,
    v_meta,
    'email',
    null,
    v_now,
    v_now
  );

  select id
  into v_patient_id
  from public.patients
  where user_id = v_user_id
    and deleted_at is null
  limit 1;

  if v_patient_id is null then
    insert into public.patients (user_id)
    values (v_user_id)
    returning id into v_patient_id;
  end if;

  update public.patients
  set gender = v_req.gender,
      age_years = v_req.age_years,
      updated_at = v_now
  where id = v_patient_id;

  insert into public.appointments (
    appointment_code,
    patient_id,
    clinic_id,
    physiotherapist_id,
    category_id,
    preferred_date,
    preferred_time,
    scheduled_date,
    scheduled_time,
    symptoms,
    status,
    checked_in_at,
    created_by
  )
  values (
    '',
    v_patient_id,
    v_req.clinic_id,
    v_physio_id,
    v_category_id,
    v_visit_date,
    v_visit_time,
    v_visit_date,
    v_visit_time,
    'Direct booking request. Phone: ' || v_req.phone,
    'checked_in',
    v_now,
    v_staff_id
  )
  returning * into v_appt;

  update public.direct_booking_requests
  set status = 'converted',
      contacted_at = coalesce(contacted_at, v_now),
      ready_at = coalesce(ready_at, v_now),
      converted_at = v_now,
      converted_by = v_staff_id,
      patient_user_id = v_user_id,
      patient_id = v_patient_id,
      appointment_id = v_appt.id,
      updated_at = v_now
  where id = v_req.id;

  return jsonb_build_object(
    'request_id', v_req.id,
    'user_id', v_user_id,
    'patient_id', v_patient_id,
    'appointment_id', v_appt.id,
    'appointment_code', v_appt.appointment_code,
    'email', v_email
  );
end;
$$;

create or replace function public.convert_direct_booking_request(
  p_request_id uuid,
  p_email text,
  p_password text,
  p_category_id uuid default null,
  p_scheduled_date date default null,
  p_scheduled_time time default null
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.create_patient_account_from_direct_request(
    p_request_id,
    p_email,
    p_password,
    p_category_id,
    p_scheduled_date,
    p_scheduled_time
  );
$$;

revoke all on function private.create_patient_account_from_direct_request(uuid, text, text, uuid, date, time)
  from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.create_patient_account_from_direct_request(uuid, text, text, uuid, date, time)
  to authenticated;

revoke all on function public.convert_direct_booking_request(uuid, text, text, uuid, date, time)
  from public, anon;
grant execute on function public.convert_direct_booking_request(uuid, text, text, uuid, date, time)
  to authenticated;
