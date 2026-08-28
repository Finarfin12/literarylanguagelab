require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.from('daily_activities').select('*');
  console.log("Rows:", data ? data.length : 0);

  // Since we can't easily query pg_policies via REST, let's see if we can do it via a user token
  // Let's sign in a user to test RLS
  const authSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data: signInData, error: signInError } = await authSupabase.auth.signInWithPassword({
    email: 'test@example.com', // wait, I don't know the user's password
    password: 'password'
  });
  console.log(signInError?.message);
}
test();
