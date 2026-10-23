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

import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigured } from './supabaseConfig'

export { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigured }

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

/**
 * Signed links for files in a private storage bucket (e.g. app feed photos). Only works for files
 * the database lets the public see; others come back without a link. Links last a year so pages
 * baked at build time keep working; they are refreshed whenever the data is.
 */
export async function restSignUrls(bucket, paths, { expiresIn = 60 * 60 * 24 * 365 } = {}) {
  if (!supabaseConfigured || paths.length === 0) return {}
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${bucket}`, {
    method: 'POST',
    headers: supabaseHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ expiresIn, paths }),
  })
  if (!res.ok) return {}
  const rows = await res.json()
  const out = {}
  for (const r of rows || []) {
    if (r?.path && r?.signedURL && !r.error) out[r.path] = encodeURI(`${SUPABASE_URL}/storage/v1${r.signedURL}`)
  }
  return out
}
