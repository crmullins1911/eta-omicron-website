import { createClient } from '@supabase/supabase-js'

// This site is designed to share the SAME Supabase project as app.etaomicron.org
// so Brothers Only logins use one set of member accounts across both apps.
//
// Set these in a local .env file (see .env.example) or in your Vercel
// project's Environment Variables when you deploy.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Fail with a clear message (shown on the Brothers Only page) instead of a cryptic one.
  throw new Error(
    'MISSING_SUPABASE_CONFIG: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set for this deployment. ' +
      'Add them in Vercel (Settings > Environment Variables, same values as app.etaomicron.org) and redeploy.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
