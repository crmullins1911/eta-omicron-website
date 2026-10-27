// Persistent data cache (stale-while-revalidate).
//
// Every public data set (events, media, committee documents) is stored under a key with the time
// it was fetched. Three layers, fastest first:
//
//   1. Seed     - data baked into the page's HTML at build time (window.__EO_SEED__), so the first
//                 paint already has real content and React hydrates without a flash.
//   2. Storage  - localStorage, so returning visitors see the last data they loaded instantly,
//                 across tabs and sessions, even offline.
//   3. Network  - refreshed in the background when the cached copy is older than its TTL.
//
// Tabs stay in sync: when one tab refreshes a key, the others pick it up via the storage event.

const NS = 'eo:cache:v1:'
const isBrowser = typeof window !== 'undefined'

const memory = new Map() // key -> { data, at, source }
const listeners = new Map() // key -> Set<fn>
const inflight = new Map() // key -> Promise

// ---- seed (build-time data) -------------------------------------------------------------------

let seed = isBrowser ? window.__EO_SEED__ || null : null

/** Used by the prerender step to supply build-time data for the page being rendered. */
export function setServerSeed(value) {
  seed = value
}

export function getSeed() {
  return seed
}

/** The moment the seed was captured; used so "today" matches between build and hydration. */
export function seedTime() {
  return seed?.builtAt ?? null
}

function readSeed(key) {
  const entry = seed?.data?.[key]
  return entry ? { ...entry, source: entry.source || 'live' } : null
}

// ---- storage ----------------------------------------------------------------------------------

function storage() {
  try {
    return isBrowser ? window.localStorage : null
  } catch {
    return null // blocked storage (private mode, strict settings)
  }
}

function readStored(key) {
  const ls = storage()
  if (!ls) return null
  try {
    const raw = ls.getItem(NS + key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeStored(key, entry) {
  const ls = storage()
  if (!ls) return
  try {
    ls.setItem(NS + key, JSON.stringify(entry))
  } catch {
    // Quota exceeded: drop our own entries and try once more.
    try {
      clearCache()
      ls.setItem(NS + key, JSON.stringify(entry))
    } catch {
      /* give up quietly; the in-memory copy still works */
    }
  }
}

export function clearCache() {
  const ls = storage()
  if (!ls) return
  try {
    Object.keys(ls)
      .filter((k) => k.startsWith(NS))
      .forEach((k) => ls.removeItem(k))
  } catch {
    /* ignore */
  }
  memory.clear()
}

// ---- public API -------------------------------------------------------------------------------

/**
 * The entry to render first. While hydrating prerendered HTML we must start from the same data
 * the HTML was built with (the seed); otherwise use whatever is freshest locally.
 */
export function initialEntry(key, { hydrating }) {
  const seeded = readSeed(key)
  if (hydrating && seeded) return seeded
  return freshest(memory.get(key), readStored(key), seeded)
}

/** The newest locally available entry (memory, storage or seed). */
export function peek(key) {
  return freshest(memory.get(key), readStored(key), readSeed(key))
}

function freshest(...entries) {
  return entries.filter(Boolean).sort((a, b) => (b.at || 0) - (a.at || 0))[0] || null
}

export function write(key, entry) {
  memory.set(key, entry)
  if (entry.source === 'live') writeStored(key, entry) // never persist placeholder data
  listeners.get(key)?.forEach((fn) => fn(entry))
}

export function subscribe(key, fn) {
  if (!listeners.has(key)) listeners.set(key, new Set())
  listeners.get(key).add(fn)
  return () => listeners.get(key)?.delete(fn)
}

/** Fetch once per key at a time; concurrent callers share the same request. */
export function revalidate(query) {
  if (inflight.has(query.key)) return inflight.get(query.key)
  const p = query
    .fetch()
    .then((data) => {
      const entry = { data, at: Date.now(), source: 'live' }
      write(query.key, entry)
      return entry
    })
    .finally(() => inflight.delete(query.key))
  inflight.set(query.key, p)
  return p
}

export function isStale(entry, ttl) {
  return !entry || entry.source !== 'live' || Date.now() - (entry.at || 0) > ttl
}

// Keep other tabs in sync.
if (isBrowser) {
  window.addEventListener('storage', (e) => {
    if (!e.key || !e.key.startsWith(NS) || !e.newValue) return
    try {
      const key = e.key.slice(NS.length)
      const entry = JSON.parse(e.newValue)
      memory.set(key, entry)
      listeners.get(key)?.forEach((fn) => fn(entry))
    } catch {
      /* ignore */
    }
  })
}
