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

export const SUPABASE_URL = cleanUrl(rawUrl)
export const SUPABASE_ANON_KEY = stripQuotesAndSpace(rawKey, 'VITE_SUPABASE_ANON_KEY')
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
