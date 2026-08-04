import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gnmahvpujdthvthsypaj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdubWFodnB1amR0aHZ0aHN5cGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0Nzg4NDgsImV4cCI6MjEwMDA1NDg0OH0.p-Qn3d021oiVbZ8jgSbsUZ0N2uWRMjOfz_3EUJWuRns';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspect() {
  const login = await supabase.auth.signInWithPassword({
    email: 'admin@corpergo.in',
    password: '123456',
  });
  console.log('Login res:', login.data?.user?.id, login.error?.message);

  const { data: clinics, error: cErr } = await supabase.from('clinics').select('id, name, slug');
  console.log('Clinics:', clinics, cErr?.message);

  const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, role, full_name, email, clinic_id');
  console.log('Profiles:', profiles, pErr?.message);

  const { data: physios, error: phErr } = await supabase.from('physiotherapists').select('id, user_id, clinic_id');
  console.log('Physiotherapists:', physios, phErr?.message);

  const { data: appointments, error: aErr } = await supabase.from('appointments').select('id, appointment_code, status, clinic_id, preferred_date, preferred_time');
  console.log('Appointments:', appointments, aErr?.message);
}

inspect();
