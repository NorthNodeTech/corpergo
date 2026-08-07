-- Restore standard profile trigger: store email + phone on patient signup.

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

-- Ensure existing patient profiles have phone populated from auth metadata where missing.
update public.profiles p
set phone = nullif(u.raw_user_meta_data ->> 'phone', '')
from auth.users u
where p.id = u.id
  and p.role = 'patient'
  and p.deleted_at is null
  and (p.phone is null or p.phone = '')
  and nullif(u.raw_user_meta_data ->> 'phone', '') is not null;

drop function if exists public.resolve_patient_login_email(text);
