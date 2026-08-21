-- Reset staff passwords to clinic-name passwords (admin = 123456)
-- and sync app_metadata roles used by JWT claims.
-- Also align clinic display names/addresses with homepage carousel.

UPDATE auth.users
SET
  encrypted_password = extensions.crypt(
    CASE email
      WHEN 'physio.chansandra@corpergo.in' THEN 'Chansandra'
      WHEN 'physio.balagere@corpergo.in' THEN 'Balagere'
      WHEN 'physio.muthsandra@corpergo.in' THEN 'Muthsandra'
      WHEN 'physio.kannamangala@corpergo.in' THEN 'Kannamangala'
      WHEN 'physio.manduru@corpergo.in' THEN 'Manduru'
      WHEN 'admin@corpergo.in' THEN '123456'
    END,
    extensions.gen_salt('bf')
  ),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
    'provider', 'email',
    'providers', jsonb_build_array('email'),
    'role', CASE
      WHEN email = 'admin@corpergo.in' THEN 'admin'
      ELSE 'physiotherapist'
    END
  ),
  raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
    'role', CASE
      WHEN email = 'admin@corpergo.in' THEN 'admin'
      ELSE 'physiotherapist'
    END
  ),
  updated_at = now()
WHERE email IN (
  'physio.chansandra@corpergo.in',
  'physio.balagere@corpergo.in',
  'physio.muthsandra@corpergo.in',
  'physio.kannamangala@corpergo.in',
  'physio.manduru@corpergo.in',
  'admin@corpergo.in'
);

UPDATE public.profiles p
SET
  role = CASE
    WHEN p.email = 'admin@corpergo.in' THEN 'admin'::public.app_role
    ELSE 'physiotherapist'::public.app_role
  END,
  updated_at = now()
WHERE p.email IN (
  'physio.chansandra@corpergo.in',
  'physio.balagere@corpergo.in',
  'physio.muthsandra@corpergo.in',
  'physio.kannamangala@corpergo.in',
  'physio.manduru@corpergo.in',
  'admin@corpergo.in'
);

UPDATE public.clinics
SET name = 'Channasandra',
    address = 'Kadugodi, Whitefield, Bengaluru'
WHERE slug = 'chansandra';

UPDATE public.clinics
SET name = 'Balagere',
    address = 'Varthur, Bengaluru'
WHERE slug = 'balagere';

UPDATE public.clinics
SET name = 'Muthsandra',
    address = 'Madhura Nagar, Varthur, Bengaluru'
WHERE slug = 'muthsandra';

UPDATE public.clinics
SET name = 'Kannamangala',
    address = 'Whitefield–Hoskote Road, Bengaluru'
WHERE slug = 'kannamangala';

UPDATE public.clinics
SET name = 'Manduru',
    address = 'Budigere Old Madras Road, Bengaluru'
WHERE slug = 'manduru';
