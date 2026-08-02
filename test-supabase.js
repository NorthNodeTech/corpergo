import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gnmahvpujdthvthsypaj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdubWFodnB1amR0aHZ0aHN5cGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0Nzg4NDgsImV4cCI6MjEwMDA1NDg0OH0.p-Qn3d021oiVbZ8jgSbsUZ0N2uWRMjOfz_3EUJWuRns';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  // Try to login
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@corpergo.in',
    password: '123456',
  });

  if (error) {
    console.error('Login failed:', error.message);
  } else {
    console.log('Login successful! User ID:', data.user.id);
  }

  // Check if we can fetch categories
  const { data: categories, error: catError } = await supabase.from('physiotherapy_categories').select('*');
  if (catError) {
    console.error('Fetch categories failed:', catError.message);
  } else {
    console.log(`Fetched ${categories.length} categories successfully.`);
  }
}

testConnection();
