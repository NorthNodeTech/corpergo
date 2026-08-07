-- Phone-first patient auth + fix staff auth metadata for correct roles.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_role public.app_role;
  contact_email text;
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

  contact_email := nullif(new.raw_user_meta_data ->> 'contact_email', '');

  insert into public.profiles (id, role, full_name, phone, email)
  values (
    new.id,
    chosen_role,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1), 'User'),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    case
      when contact_email is not null then contact_email
      when new.email like '%@phone.corpergo.in' then null
      else new.email
    end
  );

  if chosen_role = 'patient' then
    insert into public.patients (user_id) values (new.id);
  end if;

  return new;
end;
$$;

create or replace function public.resolve_patient_login_email(p_phone text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  with normalized as (
    select regexp_replace(p_phone, '[^0-9]', '', 'g') as digits
  )
  select au.email
  from auth.users au
  join public.profiles p on p.id = au.id
  cross join normalized n
  where p.role = 'patient'
    and p.deleted_at is null
    and regexp_replace(coalesce(p.phone, ''), '[^0-9]', '', 'g') = n.digits
  limit 1;
$$;

grant execute on function public.resolve_patient_login_email(text) to anon, authenticated;

-- Sync auth metadata role from profiles (fixes staff accounts created with role=patient in metadata).
update auth.users au
set raw_user_meta_data = coalesce(au.raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', p.role)
from public.profiles p
where p.id = au.id
  and p.deleted_at is null
  and p.role is not null
  and coalesce(au.raw_user_meta_data ->> 'role', '') is distinct from p.role::text;
