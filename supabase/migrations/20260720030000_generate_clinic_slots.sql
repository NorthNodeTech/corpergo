-- Generate available clinic slots for a date range based on clinic working hours
create or replace function public.generate_clinic_slots(
  p_from date default (timezone('Asia/Kolkata', now()))::date,
  p_days integer default 60
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer := 0;
  r record;
  d date;
  dow text;
  hours jsonb;
  open_t time;
  close_t time;
  cur_t time;
  end_t time;
  dur interval;
begin
  for r in
    select
      c.id as clinic_id,
      c.working_hours,
      c.slot_duration_minutes,
      ph.id as physiotherapist_id
    from public.clinics c
    join public.physiotherapists ph on ph.clinic_id = c.id and ph.deleted_at is null and ph.is_active
    where c.deleted_at is null and c.is_active
  loop
    dur := make_interval(mins => r.slot_duration_minutes);
    for i in 0..(p_days - 1) loop
      d := p_from + i;
      dow := lower(to_char(d, 'dy'));
      hours := r.working_hours -> dow;
      if hours is null or hours = 'null'::jsonb then
        continue;
      end if;
      open_t := (hours ->> 'open')::time;
      close_t := (hours ->> 'close')::time;
      if open_t is null or close_t is null then
        continue;
      end if;
      cur_t := open_t;
      while cur_t + dur <= close_t loop
        end_t := cur_t + dur;
        insert into public.clinic_slots (
          clinic_id, physiotherapist_id, slot_date, start_time, end_time, is_available
        )
        values (r.clinic_id, r.physiotherapist_id, d, cur_t, end_t, true)
        on conflict (clinic_id, physiotherapist_id, slot_date, start_time) do nothing;
        if found then
          v_inserted := v_inserted + 1;
        end if;
        cur_t := end_t;
      end loop;
    end loop;
  end loop;
  return v_inserted;
end;
$$;

grant execute on function public.generate_clinic_slots(date, integer) to authenticated, anon;

select public.generate_clinic_slots((timezone('Asia/Kolkata', now()))::date, 60);
