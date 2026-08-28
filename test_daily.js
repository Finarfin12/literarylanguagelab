require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: users, error: err1 } = await supabase.auth.admin.listUsers();
  if (!users || users.users.length === 0) {
      console.log("No users found");
      return;
  }
  const userId = users.users[0].id;
  
  const today = new Date().toISOString().split('T')[0];
  console.log("Trying to insert for", userId, "date", today);
  
  const { data: inserted, error: insertError } = await supabase
    .from('daily_activities')
    .insert({ user_id: userId, date: today })
    .select()
    .single();
    
  console.log("Insert result:", inserted, "Error:", insertError);
}
test();
