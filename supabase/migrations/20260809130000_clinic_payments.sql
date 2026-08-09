-- Clinic payment collections: persisted for physio recording and admin network reporting.

create table if not exists public.clinic_payments (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics (id) on delete restrict,
  patient_name text not null,
  patient_phone text not null,
  amount numeric(12, 2) not null,
  payment_method text not null,
  notes text,
  payment_date date not null,
  payment_time text,
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint clinic_payments_name_not_blank check (length(trim(patient_name)) > 0),
  constraint clinic_payments_phone_not_blank check (length(trim(patient_phone)) >= 8),
  constraint clinic_payments_amount_positive check (amount > 0),
  constraint clinic_payments_method_check check (
    payment_method in ('UPI', 'Cash', 'Card', 'Other')
  )
);

comment on table public.clinic_payments is
  'Manual patient payment records entered by clinic staff; aggregated in admin by date.';

create index if not exists clinic_payments_clinic_date_idx
  on public.clinic_payments (clinic_id, payment_date desc)
  where deleted_at is null;

create index if not exists clinic_payments_date_idx
  on public.clinic_payments (payment_date desc)
  where deleted_at is null;

drop trigger if exists clinic_payments_set_updated_at on public.clinic_payments;
create trigger clinic_payments_set_updated_at
  before update on public.clinic_payments
  for each row execute function public.set_updated_at();

alter table public.clinic_payments enable row level security;

drop policy if exists clinic_payments_staff_select on public.clinic_payments;
create policy clinic_payments_staff_select
  on public.clinic_payments for select
  to authenticated
  using (
    deleted_at is null
    and (
      public.is_admin_level()
      or clinic_id = public.current_staff_clinic_id()
    )
  );

drop policy if exists clinic_payments_staff_insert on public.clinic_payments;
create policy clinic_payments_staff_insert
  on public.clinic_payments for insert
  to authenticated
  with check (
    public.is_admin_level()
    or clinic_id = public.current_staff_clinic_id()
  );

drop policy if exists clinic_payments_staff_update on public.clinic_payments;
create policy clinic_payments_staff_update
  on public.clinic_payments for update
  to authenticated
  using (
    deleted_at is null
    and (
      public.is_admin_level()
      or clinic_id = public.current_staff_clinic_id()
    )
  )
  with check (
    public.is_admin_level()
    or clinic_id = public.current_staff_clinic_id()
  );

revoke all on public.clinic_payments from anon, authenticated;
grant select, insert, update on public.clinic_payments to authenticated;
