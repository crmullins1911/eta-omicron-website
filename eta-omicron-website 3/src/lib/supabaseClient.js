import { createClient } from '@supabase/supabase-js'

// This site is designed to share the SAME Supabase project as app.etaomicron.org
// so Brothers Only logins use one set of member accounts across both apps.
//
// Set these in a local .env file (see .env.example) or in your Vercel
// project's Environment Variables when you deploy.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[supabaseClient] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env and fill in your Supabase project credentials ' +
      '(the same ones used by app.etaomicron.org).'
  )
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '')
