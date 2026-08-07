import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gnmahvpujdthvthsypaj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdubWFodnB1amR0aHZ0aHN5cGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0Nzg4NDgsImV4cCI6MjEwMDA1NDg0OH0.p-Qn3d021oiVbZ8jgSbsUZ0N2uWRMjOfz_3EUJWuRns';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRealFlow() {
  console.log('--- TESTING REAL SUPABASE FLOW ---');
  
  // 1. Fetch clinics
  const { data: clinics } = await supabase.from('clinics').select('id, name, slug');
  console.log('Clinics in DB:', clinics);

  // 2. Login as physio chansandra
  const chansandraLogin = await supabase.auth.signInWithPassword({
    email: 'physio.chansandra@corpergo.in',
    password: 'Chansandra',
  });
  console.log('Physio Chansandra User ID:', chansandraLogin.data?.user?.id, 'Error:', chansandraLogin.error?.message);

  if (chansandraLogin.data?.user) {
    const { data: chansandraProfile } = await supabase.from('profiles').select('*').eq('id', chansandraLogin.data.user.id);
    console.log('Chansandra Profile in DB:', chansandraProfile);

    const { data: chansandraPhysio } = await supabase.from('physiotherapists').select('*').eq('user_id', chansandraLogin.data.user.id);
    console.log('Chansandra Physiotherapist Record in DB:', chansandraPhysio);

    // Query pending appointments for Chansandra clinic_id
    const chansandraClinicId = chansandraProfile?.[0]?.clinic_id || chansandraPhysio?.[0]?.clinic_id;
    console.log('Chansandra Clinic ID to query:', chansandraClinicId);

    const { data: pendingAppts, error: apptErr } = await supabase
      .from('appointments')
      .select('id, appointment_code, clinic_id, status, preferred_date, preferred_time, patient_id')
      .eq('clinic_id', chansandraClinicId)
      .eq('status', 'pending');
    console.log('Pending Appts for Chansandra:', pendingAppts, 'Error:', apptErr?.message);
  }

  // 3. Login as physio balagere
  const balagereLogin = await supabase.auth.signInWithPassword({
    email: 'physio.balagere@corpergo.in',
    password: 'Balagere',
  });
  console.log('Physio Balagere User ID:', balagereLogin.data?.user?.id, 'Error:', balagereLogin.error?.message);

  if (balagereLogin.data?.user) {
    const { data: balagereProfile } = await supabase.from('profiles').select('*').eq('id', balagereLogin.data.user.id);
    console.log('Balagere Profile in DB:', balagereProfile);

    const { data: balagerePhysio } = await supabase.from('physiotherapists').select('*').eq('user_id', balagereLogin.data.user.id);
    console.log('Balagere Physiotherapist Record in DB:', balagerePhysio);

    const balagereClinicId = balagereProfile?.[0]?.clinic_id || balagerePhysio?.[0]?.clinic_id;
    console.log('Balagere Clinic ID to query:', balagereClinicId);

    const { data: pendingAppts, error: apptErr } = await supabase
      .from('appointments')
      .select('id, appointment_code, clinic_id, status, preferred_date, preferred_time, patient_id')
      .eq('clinic_id', balagereClinicId)
      .eq('status', 'pending');
    console.log('Pending Appts for Balagere:', pendingAppts, 'Error:', apptErr?.message);
  }
}

testRealFlow();
