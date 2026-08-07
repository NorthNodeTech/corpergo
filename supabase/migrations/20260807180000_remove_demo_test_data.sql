-- Remove seeded test/demo patient accounts and their appointments
-- These were created during development and should not appear in production flows.

UPDATE public.appointments
SET deleted_at = now()
WHERE deleted_at IS NULL
  AND patient_id IN (
    SELECT p.id
    FROM public.patients p
    JOIN public.profiles pr ON pr.id = p.user_id
    WHERE pr.email IN (
      'randompatient123@corpergo.com',
      'testpatient@example.com',
      'testpatient_1785258643974@corpergo.in',
      'john@example.com',
      'patient_demo_872@corpergo.in'
    )
    AND p.deleted_at IS NULL
  );

UPDATE public.patients
SET deleted_at = now()
WHERE deleted_at IS NULL
  AND user_id IN (
    SELECT id FROM public.profiles
    WHERE email IN (
      'randompatient123@corpergo.com',
      'testpatient@example.com',
      'testpatient_1785258643974@corpergo.in',
      'john@example.com',
      'patient_demo_872@corpergo.in'
    )
    AND deleted_at IS NULL
  );

UPDATE public.profiles
SET deleted_at = now()
WHERE deleted_at IS NULL
  AND email IN (
    'randompatient123@corpergo.com',
    'testpatient@example.com',
    'testpatient_1785258643974@corpergo.in',
    'john@example.com',
    'patient_demo_872@corpergo.in'
  );
