/**
 * Quick auth smoke test — staff passwords + patient signup/login cycle.
 * Run: node scratch/test-auth-flow.js
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://gnmahvpujdthvthsypaj.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdubWFodnB1amR0aHZ0aHN5cGFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0Nzg4NDgsImV4cCI6MjEwMDA1NDg0OH0.p-Qn3d021oiVbZ8jgSbsUZ0N2uWRMjOfz_3EUJWuRns";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STAFF = [
  { email: "physio.chansandra@corpergo.in", password: "Chansandra" },
  { email: "physio.balagere@corpergo.in", password: "Balagere" },
  { email: "physio.muthsandra@corpergo.in", password: "Muthsandra" },
  { email: "physio.kannamangala@corpergo.in", password: "Kannamangala" },
  { email: "physio.manduru@corpergo.in", password: "Manduru" },
  { email: "admin@corpergo.in", password: "123456" },
];

async function testStaffLogin({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.log(`FAIL staff ${email}: ${error.message}`);
    return false;
  }
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("role, clinic_id, full_name")
    .eq("id", data.user.id)
    .single();
  if (profileErr) {
    console.log(`FAIL profile ${email}: ${profileErr.message}`);
    await supabase.auth.signOut();
    return false;
  }
  console.log(`OK staff ${email} → role=${profile.role}, clinic_id=${profile.clinic_id ?? "null"}`);
  await supabase.auth.signOut();
  return true;
}

async function testPatientCycle() {
  const testEmail = `test.patient.${Date.now()}@corpergo.test`;
  const password = "TestPass123";

  const signUp = await supabase.auth.signUp({
    email: testEmail,
    password,
    options: {
      data: {
        full_name: "Test Patient",
        phone: "+917077737718",
        role: "patient",
      },
    },
  });

  if (signUp.error) {
    console.log(`FAIL patient signup: ${signUp.error.message}`);
    return false;
  }

  const hasSession = Boolean(signUp.data.session);
  console.log(`patient signup ${testEmail}: session=${hasSession}, confirmed=${signUp.data.user?.email_confirmed_at ?? "pending"}`);

  const login = await supabase.auth.signInWithPassword({ email: testEmail, password });
  if (login.error) {
    console.log(`FAIL patient login (may need email confirm): ${login.error.message}`);
    return hasSession;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, phone")
    .eq("id", login.data.user.id)
    .single();

  console.log(`OK patient login → role=${profile?.role}, name=${profile?.full_name}, phone=${profile?.phone}`);
  await supabase.auth.signOut();
  return true;
}

async function main() {
  console.log("=== CorpErgo auth smoke test ===\n");

  let staffOk = 0;
  for (const cred of STAFF) {
    if (await testStaffLogin(cred)) staffOk++;
  }
  console.log(`\nStaff: ${staffOk}/${STAFF.length} passed\n`);

  await testPatientCycle();
}

main().catch(console.error);
