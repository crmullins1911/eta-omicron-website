// Reads the Supabase settings from Vercel and repairs common paste mistakes, so a stray space,
// quote marks, http:// instead of https://, or a pasted API path doesn't silently break the site.
// The status page (/status) lists anything that had to be repaired so it can be fixed in Vercel.

const rawUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const settingFixes = []

function stripQuotesAndSpace(value, name) {
  let s = String(value)
  if (/\s/.test(s)) settingFixes.push(`${name} contained spaces or line breaks`)
  s = s.replace(/\s+/g, '')
  if (/^["'`].*["'`]$/.test(s)) {
    settingFixes.push(`${name} was wrapped in quote marks`)
    s = s.slice(1, -1)
  }
  return s
}

function cleanUrl(value) {
  let s = stripQuotesAndSpace(value, 'VITE_SUPABASE_URL')
  if (!s) return ''
  if (!/^https?:\/\//i.test(s)) {
    settingFixes.push('VITE_SUPABASE_URL was missing https://')
    s = 'https://' + s
  }
  if (/^http:\/\//i.test(s) && /\.supabase\.(co|in)/i.test(s)) {
    settingFixes.push('VITE_SUPABASE_URL used http:// instead of https://')
    s = s.replace(/^http:\/\//i, 'https://')
  }
  try {
    const u = new URL(s)
    if (u.pathname !== '/' || u.search) settingFixes.push(`VITE_SUPABASE_URL had extra text after the address ("${u.pathname}${u.search}")`)
    return `${u.protocol}//${u.host}`
  } catch {
    settingFixes.push('VITE_SUPABASE_URL is not a valid web address')
    return ''
  }
}

// Supabase public keys come in two forms: the classic "anon" key (a long token starting "eyJ")
// and the newer "publishable" key (starting "sb_publishable_"). If the pasted value contains
// anything else (a "Bearer" prefix, a label, two keys), pick out the key itself.
function cleanKey(value) {
  const original = String(value).trim().replace(/^["'`]|["'`]$/g, '')
  const tokens = original.split(/[\s,;"'`]+/).filter(Boolean)
  const key =
    tokens.find((t) => /^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(t)) ||
    tokens.find((t) => /^sb_publishable_[\w-]+$/.test(t)) ||
    tokens.join('')
  if (tokens.length > 1) settingFixes.push(`VITE_SUPABASE_ANON_KEY had extra text around the key (${tokens.length} pieces); used the key itself`)
  else if (/\s/.test(String(value))) settingFixes.push('VITE_SUPABASE_ANON_KEY contained spaces or line breaks')
  return key
}

/** What kind of key this is, without revealing it. */
export function describeKey(key, url) {
  if (!key) return { kind: 'missing', ok: false, note: 'No key is set.' }
  if (key.startsWith('sb_publishable_')) return { kind: 'publishable key', ok: true, note: 'Newer Supabase publishable key.' }
  if (key.startsWith('sb_secret_')) {
    return { kind: 'SECRET key', ok: false, note: 'This is a secret key and must never be on a website. Replace it with the anon or publishable key, and rotate the secret key in Supabase.' }
  }
  const parts = key.split('.')
  if (parts.length === 3 && key.startsWith('eyJ')) {
    try {
      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
      const host = (() => { try { return new URL(url).host } catch { return '' } })()
      const projectRef = host.split('.')[0]
      if (payload.role === 'service_role') {
        return { kind: 'SERVICE ROLE key', ok: false, note: 'This is the secret service_role key and must never be on a website. Use the anon public key instead, and rotate the service_role key in Supabase.' }
      }
      if (payload.ref && projectRef && payload.ref !== projectRef) {
        return { kind: `anon key for a DIFFERENT project (${payload.ref})`, ok: false, note: `The key belongs to project ${payload.ref}, but the address is ${projectRef}. Copy both from the same project.` }
      }
      if (payload.exp && payload.exp * 1000 < Date.now()) return { kind: 'expired key', ok: false, note: 'This key has expired. Copy the current anon key from Supabase.' }
      return { kind: `${payload.role || 'anon'} key for ${payload.ref || 'this project'}`, ok: true, note: '' }
    } catch {
      return { kind: 'unreadable key', ok: false, note: 'The key looks damaged (part of it may be missing). Copy it again from Supabase.' }
    }
  }
  return { kind: 'unrecognized key', ok: false, note: `The key doesn't look like a Supabase key (it is ${key.length} characters and starts "${key.slice(0, 4)}…"). Copy the anon public or publishable key again.` }
}

export const SUPABASE_URL = cleanUrl(rawUrl)
export const SUPABASE_ANON_KEY = cleanKey(rawKey)
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
// Newer publishable keys are not tokens and must not be sent as "Authorization: Bearer".
export const KEY_IS_JWT = SUPABASE_ANON_KEY.startsWith('eyJ')
