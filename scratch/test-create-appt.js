import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gnmahvpujdthvthsypaj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdubWFodnB1amR0aHZ0aHN5cGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0Nzg4NDgsImV4cCI6MjEwMDA1NDg0OH0.p-Qn3d021oiVbZ8jgSbsUZ0N2uWRMjOfz_3EUJWuRns';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAppointmentCreation() {
  console.log('--- TESTING APPOINTMENT CREATION ---');

  // Login as a patient
  const patientLogin = await supabase.auth.signInWithPassword({
    email: 'mohd13adnan15@gmail.com',
    password: '123456',
  });
  console.log('Patient login:', patientLogin.data?.user?.id, patientLogin.error?.message);

  if (patientLogin.data?.user) {
    const { data: patientRec, error: pErr } = await supabase.from('patients').select('id').eq('user_id', patientLogin.data.user.id);
    console.log('Patient rec:', patientRec, pErr?.message);

    const patientId = patientRec?.[0]?.id || patientLogin.data.user.id;
    const chansandraClinicId = '0e490158-e027-4948-940c-8881c3e74585';
    const catId = 'cat-1'; // or fetch category

    const { data: categories } = await supabase.from('physiotherapy_categories').select('id').limit(1);
    const categoryId = categories?.[0]?.id;

    console.log('Creating test appointment for Chansandra clinic:', chansandraClinicId);

    const { data: newAppt, error: apptErr } = await supabase.from('appointments').insert({
      appointment_code: '',
      patient_id: patientId,
      clinic_id: chansandraClinicId,
      category_id: categoryId,
      preferred_date: '2026-08-10',
      preferred_time: '10:00:00',
      symptoms: 'Lower back stiffness test',
      status: 'pending',
      created_by: patientLogin.data.user.id
    }).select('*');

    console.log('Insert result:', newAppt, 'Error:', apptErr?.message);
  }
}

testAppointmentCreation();
