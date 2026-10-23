// Lightweight read-only access to Supabase's REST API.
//
// Public pages (Home, Events, Media, Committees) only need to READ public rows, so they talk to
// Supabase with plain fetch() instead of loading the full supabase-js client (~40 KB gzipped).
// supabase-js is still used for sign-in, and is only downloaded when a visitor reaches the
// Brothers Only area (see src/context/AuthContext.jsx).
//
// Reads always use the anon key, so they return exactly what the public is allowed to see under
// your Row Level Security policies, even when a brother is signed in.
//
// This file runs in the browser and at build time (scripts/prerender.mjs), where Node's fetch is used.

export const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

export function supabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    ...extra,
  }
}

/**
 * restSelect('events', { select: 'title,event_date', on_website: 'eq.true', order: 'event_date.asc' })
 * Params use PostgREST syntax: https://postgrest.org/en/stable/references/api/tables_views.html
 */
export async function restSelect(table, params = {}, { signal, timeoutMs = 8000 } = {}) {
  if (!supabaseConfigured) throw new Error('Supabase is not configured')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true })

  try {
    const qs = new URLSearchParams(params).toString()
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${qs}`, {
      headers: supabaseHeaders({ Accept: 'application/json' }),
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`${table} request failed (${res.status})`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}
