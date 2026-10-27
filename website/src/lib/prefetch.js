import { likelyNext, preloadPath } from '../routes'
import { revalidate, isStale, peek } from './cache'
import { eventsQuery, mediaQuery } from './queries'

// Intelligent prefetching: load the next page's code (and its data) before the visitor clicks,
// but only when it won't compete with what they're doing now or cost them on a slow/metered link.

const dataForPath = {
  '/events': [eventsQuery],
  '/media': [mediaQuery],
  '/': [eventsQuery],
}

export function canPrefetch() {
  const c = typeof navigator !== 'undefined' ? navigator.connection : null
  if (!c) return true
  if (c.saveData) return false
  return !/(^|-)2g$/.test(c.effectiveType || '')
}

/** Called on hover / focus / touchstart of an internal link. */
export function prefetchPath(path) {
  if (!canPrefetch()) return
  preloadPath(path)
  ;(dataForPath[path] || []).forEach((q) => {
    if (isStale(peek(q.key), q.ttl)) revalidate(q).catch(() => {})
  })
}

/** After the page is interactive and the browser is idle, warm the pages people usually visit next. */
export function prefetchLikelyPagesWhenIdle(currentPath) {
  if (!canPrefetch()) return
  const run = () =>
    likelyNext
      .filter((p) => p !== currentPath)
      .reduce((chain, p) => chain.then(() => preloadPath(p)), Promise.resolve())
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 5000 })
  else setTimeout(run, 2500)
}

/** Event handlers to spread onto a link: <Link {...intent('/events')} /> */
export function intent(path) {
  const go = () => prefetchPath(path)
  return { onMouseEnter: go, onFocus: go, onTouchStart: go }
}
