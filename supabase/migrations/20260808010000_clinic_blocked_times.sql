-- Staff can block specific clinic time slots (meetings, breaks, holidays).

create table if not exists public.clinic_blocked_times (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  block_date date not null,
  start_time time not null,
  reason text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint clinic_blocked_times_unique unique (clinic_id, block_date, start_time)
);

create index if not exists clinic_blocked_times_lookup_idx
  on public.clinic_blocked_times (clinic_id, block_date);

alter table public.clinic_blocked_times enable row level security;

create policy clinic_blocked_times_read
  on public.clinic_blocked_times for select
  using (true);

create policy clinic_blocked_times_staff_write
  on public.clinic_blocked_times for all
  using (
    public.is_admin_level()
    or clinic_id = public.current_staff_clinic_id()
  )
  with check (
    public.is_admin_level()
    or clinic_id = public.current_staff_clinic_id()
  );
