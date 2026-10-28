import useCachedQuery from './useCachedQuery'
import { siteContentQuery } from '../lib/queries'

/**
 * Editable text from the Supabase "site_content" table, as { key: value } (empty values left out).
 * Use with a built-in default: `content.history || history`.
 */
export default function useSiteContent() {
  return useCachedQuery(siteContentQuery).data || {}
}

/** Split text into paragraphs on blank lines. */
export function paragraphs(text) {
  return String(text || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}
