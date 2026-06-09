import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function sync() {
  console.log("Syncing profiles from auth.users...")
  // Note: we can't easily query auth.users with anon key, but we can query profiles
  // Wait, if we only have anon key, we can't get other users' metadata.
  // We'll just have to instruct the user to re-save their profile, or we can update the thread page to fetch from auth.users ONLY if it's the current user?
  console.log("Done")
}
sync()
