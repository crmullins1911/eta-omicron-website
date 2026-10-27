import { useEffect, useState } from 'react'
import { initialEntry, isStale, peek, revalidate, subscribe } from '../lib/cache'
import { isHydrating } from '../lib/hydration'

/**
 * Read a query definition from src/lib/queries.js with persistent stale-while-revalidate caching.
 *
 * Returns { data, source, updatedAt, refreshing, error }
 *   source: 'live'     - data came from Supabase (now or from cache)
 *           'fallback' - Supabase unreachable and nothing cached; placeholder data shown
 */
export default function useCachedQuery(query) {
  const [entry, setEntry] = useState(() => initialEntry(query.key, { hydrating: isHydrating() }))
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    const unsubscribe = subscribe(query.key, (next) => active && setEntry(next))

    // After hydration, switch to anything fresher we have locally (e.g. from a previous visit).
    const local = peek(query.key)
    if (local && local !== entry && (local.at || 0) > (entry?.at || 0)) setEntry(local)

    const refresh = () => {
      if (!isStale(peek(query.key), query.ttl)) return
      setRefreshing(true)
      revalidate(query)
        .then(() => active && setError(null))
        .catch((err) => active && setError(err))
        .finally(() => active && setRefreshing(false))
    }

    refresh()

    // Refresh again when the visitor comes back to the tab, if the data has gone stale.
    const onVisible = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      active = false
      unsubscribe()
      document.removeEventListener('visibilitychange', onVisible)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.key])

  // Nothing cached and the network failed (or Supabase isn't configured): show placeholders.
  const usable = entry && !(query.emptyIsFallback && entry.source === 'live' && entry.data?.length === 0)
  const data = usable ? entry.data : query.fallback
  const source = usable ? entry.source : 'fallback'

  return {
    data,
    source,
    updatedAt: entry?.at ?? null,
    loading: !entry && refreshing,
    refreshing,
    error,
  }
}
