-- Align clinic display names and addresses with homepage map carousel spellings.
-- Keep existing slugs stable so staff/clinic references continue to resolve.
update public.clinics
set
  name = 'Channasandra',
  address = 'Kadugodi, Whitefield, Bengaluru'
where slug in ('chansandra', 'channasandra')
   or lower(name) in ('chansandra', 'channasandra');

update public.clinics
set
  name = 'Balagere',
  address = 'Varthur, Bengaluru'
where slug in ('balagere', 'balegere')
   or lower(name) in ('balagere', 'balegere');

update public.clinics
set
  name = 'Muthsandra',
  address = 'Madhura Nagar, Varthur, Bengaluru'
where slug in ('muthsandra', 'muthasandra')
   or lower(name) in ('muthsandra', 'muthasandra');

update public.clinics
set
  name = 'Kannamangala',
  address = 'Whitefield–Hoskote Road, Bengaluru'
where slug = 'kannamangala'
   or lower(name) = 'kannamangala';

update public.clinics
set
  name = 'Manduru',
  address = 'Budigere Old Madras Road, Bengaluru'
where slug in ('manduru', 'mandur')
   or lower(name) in ('manduru', 'mandur');
