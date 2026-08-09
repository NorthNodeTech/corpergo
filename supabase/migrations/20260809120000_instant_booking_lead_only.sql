-- Instant phone booking: capture lead details only; account created on session day via convert_direct_booking_request.

create or replace function private.create_instant_booking_request(
  p_full_name text,
  p_phone text,
  p_gender public.gender_type,
  p_age_years integer,
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
    raise exception 'Only clinic staff can create instant phone bookings';
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

  insert into public.direct_booking_requests (
    clinic_id,
    full_name,
    phone,
    gender,
    age_years,
    status,
    booking_source
  )
  values (
    v_clinic_id,
    trim(p_full_name),
    trim(p_phone),
    p_gender,
    p_age_years,
    'new',
    'instant'
  )
  returning * into v_request;

  return jsonb_build_object(
    'request_id', v_request.id,
    'request_code', v_request.request_code
  );
end;
$$;

create or replace function public.create_instant_booking_request(
  p_full_name text,
  p_phone text,
  p_gender public.gender_type,
  p_age_years integer,
  p_clinic_id uuid default null
)
returns jsonb
language sql
security invoker
set search_path = ''
as $$
  select private.create_instant_booking_request(
    p_full_name,
    p_phone,
    p_gender,
    p_age_years,
    p_clinic_id
  );
$$;

revoke all on function private.create_instant_booking_request(text, text, public.gender_type, integer, uuid)
  from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.create_instant_booking_request(text, text, public.gender_type, integer, uuid)
  to authenticated;

revoke all on function public.create_instant_booking_request(text, text, public.gender_type, integer, uuid)
  from public, anon;
grant execute on function public.create_instant_booking_request(text, text, public.gender_type, integer, uuid)
  to authenticated;
