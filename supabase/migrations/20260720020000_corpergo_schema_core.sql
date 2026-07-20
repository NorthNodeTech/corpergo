-- CorpErgo schema part 1: enums + tables + indexes + updated_at triggers

create extension if not exists "pgcrypto" with schema extensions;

create type public.app_role as enum (
  'super_admin',
  'admin',
  'clinic_manager',
  'receptionist',
  'physiotherapist',
  'patient'
);

comment on type public.app_role is
  'Platform roles. Start with admin/physiotherapist/patient; others reserved for staff growth.';

create type public.appointment_status as enum (
  'pending',
  'accepted',
  'rejected',
  'cancelled',
  'checked_in',
  'completed',
  'rescheduled'
);

create type public.gender_type as enum (
  'male',
  'female',
  'other',
  'prefer_not_to_say'
);

create type public.notification_channel as enum (
  'in_app',
  'email',
  'sms',
  'whatsapp'
);

create type public.notification_status as enum (
  'pending',
  'sent',
  'failed',
  'read'
);

create type public.document_type as enum (
  'report',
  'prescription',
  'image',
  'pdf',
  'consent',
  'other'
);

create type public.qr_scan_status as enum (
  'active',
  'scanned',
  'expired',
  'revoked'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.clinics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  address text not null,
  city text not null default 'Bengaluru',
  state text not null default 'Karnataka',
  pincode text,
  phone text,
  email text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  working_hours jsonb not null default '{
    "mon": {"open": "09:00", "close": "18:00"},
    "tue": {"open": "09:00", "close": "18:00"},
    "wed": {"open": "09:00", "close": "18:00"},
    "thu": {"open": "09:00", "close": "18:00"},
    "fri": {"open": "09:00", "close": "18:00"},
    "sat": {"open": "09:00", "close": "14:00"},
    "sun": null
  }'::jsonb,
  slot_duration_minutes integer not null default 30
    check (slot_duration_minutes > 0 and slot_duration_minutes <= 180),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint clinics_name_unique unique (name),
  constraint clinics_slug_unique unique (slug),
  constraint clinics_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

comment on table public.clinics is 'CorpErgo branch locations. Designed for 100+ clinics.';

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'patient',
  full_name text not null,
  phone text,
  email text,
  avatar_url text,
  clinic_id uuid references public.clinics (id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint profiles_staff_clinic_required check (
    role in ('patient', 'super_admin', 'admin')
    or clinic_id is not null
  )
);

comment on table public.profiles is
  '1:1 with auth.users. clinic_id used for clinic_manager/receptionist staff scope.';

create table public.physiotherapy_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint physiotherapy_categories_name_unique unique (name),
  constraint physiotherapy_categories_slug_unique unique (slug)
);

create table public.physiotherapists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  clinic_id uuid not null references public.clinics (id) on delete restrict,
  category_id uuid references public.physiotherapy_categories (id) on delete set null,
  specialization text,
  bio text,
  years_experience integer check (years_experience is null or years_experience >= 0),
  license_number text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint physiotherapists_user_unique unique (user_id)
);

comment on table public.physiotherapists is
  'Each physiotherapist belongs to exactly one clinic.';

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  date_of_birth date,
  gender public.gender_type,
  blood_group text,
  address text,
  city text,
  pincode text,
  medical_history text,
  allergies text,
  current_medications text,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relation text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint patients_user_unique unique (user_id)
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  appointment_code text not null,
  patient_id uuid not null references public.patients (id) on delete restrict,
  clinic_id uuid not null references public.clinics (id) on delete restrict,
  physiotherapist_id uuid references public.physiotherapists (id) on delete set null,
  category_id uuid not null references public.physiotherapy_categories (id) on delete restrict,
  preferred_date date not null,
  preferred_time time not null,
  scheduled_date date,
  scheduled_time time,
  symptoms text not null,
  status public.appointment_status not null default 'pending',
  rejection_reason text,
  cancellation_reason text,
  reschedule_reason text,
  checked_in_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint appointments_code_unique unique (appointment_code),
  constraint appointments_symptoms_not_blank check (length(trim(symptoms)) > 0)
);

comment on table public.appointments is
  'Booking lifecycle: pending → accepted/rejected/cancelled/rescheduled → checked_in → completed.';

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  pain_score integer check (pain_score is null or (pain_score between 1 and 10)),
  body_part text,
  diagnosis text,
  clinical_findings text,
  range_of_motion text,
  muscle_strength text,
  special_tests text,
  treatment_given text,
  home_exercise text,
  notes text,
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  next_visit_needed boolean not null default false,
  assessed_by uuid references public.physiotherapists (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint assessments_appointment_unique unique (appointment_id)
);

create table public.follow_up_sessions (
  id uuid primary key default gen_random_uuid(),
  from_appointment_id uuid not null references public.appointments (id) on delete cascade,
  new_appointment_id uuid references public.appointments (id) on delete set null,
  patient_id uuid not null references public.patients (id) on delete restrict,
  clinic_id uuid not null references public.clinics (id) on delete restrict,
  physiotherapist_id uuid references public.physiotherapists (id) on delete set null,
  next_visit_date date not null,
  next_visit_time time,
  notes text,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'booked', 'completed', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.qr_tickets (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments (id) on delete cascade,
  token text not null,
  scan_status public.qr_scan_status not null default 'active',
  expires_at timestamptz not null,
  scanned_at timestamptz,
  scanned_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint qr_tickets_appointment_unique unique (appointment_id),
  constraint qr_tickets_token_unique unique (token)
);

comment on table public.qr_tickets is 'Generated when an appointment is accepted.';

create table public.clinic_slots (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics (id) on delete cascade,
  physiotherapist_id uuid references public.physiotherapists (id) on delete cascade,
  slot_date date not null,
  start_time time not null,
  end_time time not null,
  is_available boolean not null default true,
  appointment_id uuid references public.appointments (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint clinic_slots_time_order check (end_time > start_time),
  constraint clinic_slots_unique_slot unique (clinic_id, physiotherapist_id, slot_date, start_time)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  title text not null,
  body text not null,
  channel public.notification_channel not null default 'in_app',
  status public.notification_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  appointment_id uuid references public.appointments (id) on delete set null,
  assessment_id uuid references public.assessments (id) on delete set null,
  uploaded_by uuid references public.profiles (id) on delete set null,
  document_type public.document_type not null default 'other',
  file_name text not null,
  storage_bucket text not null default 'patient-documents',
  storage_path text not null,
  mime_type text,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint documents_storage_path_unique unique (storage_bucket, storage_path)
);

create index profiles_role_idx on public.profiles (role) where deleted_at is null;
create index profiles_clinic_id_idx on public.profiles (clinic_id) where deleted_at is null;
create index clinics_active_idx on public.clinics (is_active) where deleted_at is null;
create index physiotherapists_clinic_id_idx on public.physiotherapists (clinic_id) where deleted_at is null;
create index physiotherapists_category_id_idx on public.physiotherapists (category_id) where deleted_at is null;
create index patients_user_id_idx on public.patients (user_id) where deleted_at is null;
create index appointments_clinic_status_idx on public.appointments (clinic_id, status) where deleted_at is null;
create index appointments_patient_id_idx on public.appointments (patient_id) where deleted_at is null;
create index appointments_physio_id_idx on public.appointments (physiotherapist_id) where deleted_at is null;
create index appointments_preferred_date_idx on public.appointments (preferred_date) where deleted_at is null;
create index appointments_scheduled_date_idx on public.appointments (scheduled_date) where deleted_at is null;
create index appointments_category_id_idx on public.appointments (category_id) where deleted_at is null;
create index appointments_status_created_idx on public.appointments (status, created_at desc) where deleted_at is null;
create index assessments_appointment_id_idx on public.assessments (appointment_id) where deleted_at is null;
create index follow_up_sessions_patient_id_idx on public.follow_up_sessions (patient_id) where deleted_at is null;
create index follow_up_sessions_clinic_id_idx on public.follow_up_sessions (clinic_id) where deleted_at is null;
create index follow_up_sessions_next_visit_idx on public.follow_up_sessions (next_visit_date) where deleted_at is null;
create index qr_tickets_token_idx on public.qr_tickets (token) where deleted_at is null;
create index qr_tickets_status_idx on public.qr_tickets (scan_status) where deleted_at is null;
create index clinic_slots_lookup_idx on public.clinic_slots (clinic_id, slot_date, is_available) where deleted_at is null;
create index notifications_user_status_idx on public.notifications (user_id, status) where deleted_at is null;
create index documents_patient_id_idx on public.documents (patient_id) where deleted_at is null;
create index documents_appointment_id_idx on public.documents (appointment_id) where deleted_at is null;

create trigger clinics_set_updated_at before update on public.clinics
  for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger physiotherapy_categories_set_updated_at before update on public.physiotherapy_categories
  for each row execute function public.set_updated_at();
create trigger physiotherapists_set_updated_at before update on public.physiotherapists
  for each row execute function public.set_updated_at();
create trigger patients_set_updated_at before update on public.patients
  for each row execute function public.set_updated_at();
create trigger appointments_set_updated_at before update on public.appointments
  for each row execute function public.set_updated_at();
create trigger assessments_set_updated_at before update on public.assessments
  for each row execute function public.set_updated_at();
create trigger follow_up_sessions_set_updated_at before update on public.follow_up_sessions
  for each row execute function public.set_updated_at();
create trigger qr_tickets_set_updated_at before update on public.qr_tickets
  for each row execute function public.set_updated_at();
create trigger clinic_slots_set_updated_at before update on public.clinic_slots
  for each row execute function public.set_updated_at();
create trigger notifications_set_updated_at before update on public.notifications
  for each row execute function public.set_updated_at();
create trigger documents_set_updated_at before update on public.documents
  for each row execute function public.set_updated_at();
