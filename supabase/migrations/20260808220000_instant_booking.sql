-- Instant booking: staff creates walk-in patient + checked-in session at the desk.

alter table public.direct_booking_requests
  add column if not exists booking_source text not null default 'web';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'direct_booking_requests_source_check'
      and conrelid = 'public.direct_booking_requests'::regclass
  ) then
    alter table public.direct_booking_requests
      add constraint direct_booking_requests_source_check
      check (booking_source in ('web', 'instant'));
  end if;
end $$;

create or replace function private.create_instant_patient_session(
  p_full_name text,
  p_phone text,
  p_gender public.gender_type,
  p_age_years integer,
  p_email text,
  p_password text,
  p_category_id uuid default null,
  p_scheduled_date date default null,
  p_scheduled_time time default null,
  p_clinic_id uuid default null
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
  v_clinic_id uuid;
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
  v_request public.direct_booking_requests%rowtype;
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
    raise exception 'Only clinic staff can create instant bookings';
  end if;

  v_clinic_id := coalesce(p_clinic_id, v_staff_clinic_id);
  if v_clinic_id is null then
    raise exception 'Clinic is required';
  end if;

  if v_staff_role not in ('super_admin', 'admin')
     and v_clinic_id is distinct from v_staff_clinic_id then
    raise exception 'This clinic belongs to another location';
  end if;

  if length(trim(coalesce(p_full_name, ''))) = 0 then
    raise exception 'Please enter the patient name';
  end if;

  if length(trim(coalesce(p_phone, ''))) < 8 then
    raise exception 'Please enter a valid phone number';
  end if;

  if p_age_years is null or p_age_years < 0 or p_age_years > 120 then
    raise exception 'Please enter a valid age';
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

  select id
  into v_physio_id
  from public.physiotherapists
  where user_id = v_staff_id
    and clinic_id = v_clinic_id
    and deleted_at is null
  limit 1;

  v_visit_date := coalesce(p_scheduled_date, (timezone('Asia/Kolkata', v_now))::date);
  v_visit_time := coalesce(p_scheduled_time, to_char(timezone('Asia/Kolkata', v_now), 'HH24:MI')::time);

  insert into public.direct_booking_requests (
    clinic_id,
    full_name,
    phone,
    gender,
    age_years,
    status,
    booking_source,
    contacted_at,
    ready_at,
    converted_at,
    converted_by
  )
  values (
    v_clinic_id,
    trim(p_full_name),
    trim(p_phone),
    p_gender,
    p_age_years,
    'converted',
    'instant',
    v_now,
    v_now,
    v_now,
    v_staff_id
  )
  returning * into v_request;

  v_meta := jsonb_build_object(
    'sub', v_user_id::text,
    'role', 'patient',
    'email', v_email,
    'phone', trim(p_phone),
    'full_name', trim(p_full_name),
    'email_verified', true,
    'phone_verified', false,
    'created_from', 'instant_booking',
    'direct_booking_request_id', v_request.id::text
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
  set gender = p_gender,
      age_years = p_age_years,
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
    v_clinic_id,
    v_physio_id,
    v_category_id,
    v_visit_date,
    v_visit_time,
    v_visit_date,
    v_visit_time,
    'Instant booking (phone walk-in). Phone: ' || trim(p_phone),
    'checked_in',
    v_now,
    v_staff_id
  )
  returning * into v_appt;

  update public.direct_booking_requests
  set patient_user_id = v_user_id,
      patient_id = v_patient_id,
      appointment_id = v_appt.id,
      updated_at = v_now
  where id = v_request.id;

  return jsonb_build_object(
    'request_id', v_request.id,
    'user_id', v_user_id,
    'patient_id', v_patient_id,
    'appointment_id', v_appt.id,
    'appointment_code', v_appt.appointment_code,
    'email', v_email
  );
end;
$$;

create or replace function public.create_instant_patient_session(
  p_full_name text,
  p_phone text,
  p_gender public.gender_type,
  p_age_years integer,
  p_email text,
  p_password text,
  p_category_id uuid default null,
  p_scheduled_date date default null,
  p_scheduled_time time default null,
  p_clinic_id uuid default null
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.create_instant_patient_session(
    p_full_name,
    p_phone,
    p_gender,
    p_age_years,
    p_email,
    p_password,
    p_category_id,
    p_scheduled_date,
    p_scheduled_time,
    p_clinic_id
  );
$$;

revoke all on function private.create_instant_patient_session(text, text, public.gender_type, integer, text, text, uuid, date, time, uuid)
  from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.create_instant_patient_session(text, text, public.gender_type, integer, text, text, uuid, date, time, uuid)
  to authenticated;

revoke all on function public.create_instant_patient_session(text, text, public.gender_type, integer, text, text, uuid, date, time, uuid)
  from public, anon;
grant execute on function public.create_instant_patient_session(text, text, public.gender_type, integer, text, text, uuid, date, time, uuid)
  to authenticated;
