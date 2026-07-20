-- CorpErgo schema part 2: helper functions, business triggers, QR scan RPC

create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and deleted_at is null;
$$;

create or replace function public.has_role(roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and deleted_at is null and role = any (roles)
  );
$$;

create or replace function public.is_admin_level()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(array['super_admin', 'admin']::public.app_role[]);
$$;

create or replace function public.current_patient_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.patients where user_id = auth.uid() and deleted_at is null limit 1;
$$;

create or replace function public.current_physio_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.physiotherapists where user_id = auth.uid() and deleted_at is null limit 1;
$$;

create or replace function public.current_staff_clinic_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select clinic_id from public.physiotherapists where user_id = auth.uid() and deleted_at is null limit 1),
    (select clinic_id from public.profiles where id = auth.uid() and deleted_at is null)
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_role public.app_role;
begin
  begin
    chosen_role := coalesce(
      (new.raw_user_meta_data ->> 'role')::public.app_role,
      'patient'::public.app_role
    );
  exception when others then
    chosen_role := 'patient'::public.app_role;
  end;

  if chosen_role in ('super_admin', 'admin', 'clinic_manager') then
    chosen_role := 'patient'::public.app_role;
  end if;

  insert into public.profiles (id, role, full_name, phone, email)
  values (
    new.id,
    chosen_role,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1), 'User'),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    new.email
  );

  if chosen_role = 'patient' then
    insert into public.patients (user_id) values (new.id);
  end if;

  return new;
end;
$$;

create or replace function public.generate_appointment_code()
returns trigger
language plpgsql
as $$
begin
  if new.appointment_code is null or new.appointment_code = '' then
    new.appointment_code :=
      'CE-' || to_char(timezone('Asia/Kolkata', now()), 'YYYYMMDD') || '-' ||
      upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  end if;
  return new;
end;
$$;

create or replace function public.on_appointment_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    new.scheduled_date := coalesce(new.scheduled_date, new.preferred_date);
    new.scheduled_time := coalesce(new.scheduled_time, new.preferred_time);

    insert into public.qr_tickets (appointment_id, token, scan_status, expires_at)
    values (
      new.id,
      encode(extensions.gen_random_bytes(24), 'hex'),
      'active',
      (coalesce(new.scheduled_date, new.preferred_date)::timestamp
        + coalesce(new.scheduled_time, new.preferred_time)
        + interval '12 hours')
    )
    on conflict (appointment_id) do update
      set token = excluded.token,
          scan_status = 'active',
          scanned_at = null,
          expires_at = excluded.expires_at,
          updated_at = timezone('utc', now()),
          deleted_at = null;

    insert into public.notifications (user_id, appointment_id, title, body, channel, status)
    select
      p.user_id,
      new.id,
      'Appointment accepted',
      'Your appointment ' || new.appointment_code || ' has been accepted. Your QR ticket is ready.',
      'in_app',
      'pending'
    from public.patients p
    where p.id = new.patient_id;
  end if;

  if new.status = 'checked_in' and old.status is distinct from 'checked_in' then
    new.checked_in_at := coalesce(new.checked_in_at, timezone('utc', now()));
  end if;

  if new.status = 'completed' and old.status is distinct from 'completed' then
    new.completed_at := coalesce(new.completed_at, timezone('utc', now()));
  end if;

  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    new.cancelled_at := coalesce(new.cancelled_at, timezone('utc', now()));
    update public.qr_tickets
    set scan_status = 'revoked', updated_at = timezone('utc', now())
    where appointment_id = new.id and scan_status = 'active' and deleted_at is null;
  end if;

  return new;
end;
$$;

create or replace function public.scan_qr_ticket(p_token text)
returns public.appointments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket public.qr_tickets;
  v_appt public.appointments;
begin
  if not (
    public.is_admin_level()
    or public.has_role(array['clinic_manager', 'receptionist', 'physiotherapist']::public.app_role[])
  ) then
    raise exception 'Not authorized to scan QR tickets';
  end if;

  select * into v_ticket
  from public.qr_tickets
  where token = p_token and deleted_at is null
  for update;

  if not found then
    raise exception 'Invalid QR ticket';
  end if;

  if v_ticket.scan_status = 'scanned' then
    raise exception 'QR ticket already scanned';
  end if;

  if v_ticket.scan_status in ('expired', 'revoked') or v_ticket.expires_at < timezone('utc', now()) then
    update public.qr_tickets
    set scan_status = 'expired', updated_at = timezone('utc', now())
    where id = v_ticket.id;
    raise exception 'QR ticket expired or revoked';
  end if;

  if not public.is_admin_level() then
    if (
      select clinic_id from public.appointments where id = v_ticket.appointment_id
    ) is distinct from public.current_staff_clinic_id() then
      raise exception 'QR ticket belongs to another clinic';
    end if;
  end if;

  update public.qr_tickets
  set scan_status = 'scanned',
      scanned_at = timezone('utc', now()),
      scanned_by = auth.uid(),
      updated_at = timezone('utc', now())
  where id = v_ticket.id;

  update public.appointments
  set status = 'checked_in'
  where id = v_ticket.appointment_id
  returning * into v_appt;

  return v_appt;
end;
$$;

comment on function public.scan_qr_ticket(text) is
  'Reception/physio scans QR → marks ticket scanned and appointment checked_in.';

create trigger appointments_generate_code
  before insert on public.appointments
  for each row execute function public.generate_appointment_code();

create trigger appointments_on_status_change
  before update on public.appointments
  for each row execute function public.on_appointment_status_change();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

grant execute on function public.scan_qr_ticket(text) to authenticated;
grant execute on function public.current_role() to authenticated;
grant execute on function public.has_role(public.app_role[]) to authenticated;
grant execute on function public.is_admin_level() to authenticated;
grant execute on function public.current_patient_id() to authenticated;
grant execute on function public.current_physio_id() to authenticated;
grant execute on function public.current_staff_clinic_id() to authenticated;
