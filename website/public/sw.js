/* Eta Omicron service worker: persistent caching on the visitor's device.
 *
 *   Pages (HTML)            network first; falls back to the cached copy when offline or slow (>3 s)
 *   /assets/* (JS, CSS)     cache first; file names change on every deploy, so cached copies never go stale
 *   Photos from Supabase    stale-while-revalidate; shows the cached photo instantly, refreshes in background
 *   Supabase data and auth  never cached here (the app's own data cache handles data; auth must stay live)
 *
 * BUILD_ID is stamped by scripts/prerender.mjs so each deploy cleans up the previous deploy's caches.
 */

const BUILD_ID = '__BUILD_ID__'
const PAGES = `eo-pages-${BUILD_ID}`
const ASSETS = 'eo-assets-v1'
const IMAGES = 'eo-images-v1'
const KEEP = [PAGES, ASSETS, IMAGES]
const MAX_IMAGES = 80
const MAX_ASSETS = 120

self.addEventListener('install', (event) => {
  // Cache the home page and app shell so the site opens offline after the first visit.
  event.waitUntil(
    caches
      .open(PAGES)
      .then((c) => c.addAll(['/', '/app-shell.html']).catch(() => {}))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('eo-') && !KEEP.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)

  if (request.mode === 'navigate' && url.origin === location.origin) {
    if (url.pathname.startsWith('/brothers')) return // member pages: always straight from the network
    event.respondWith(networkFirst(request))
    return
  }

  if (url.origin === location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, ASSETS, MAX_ASSETS))
    return
  }

  if (url.pathname.includes('/storage/v1/object/public/') || url.pathname.includes('/storage/v1/render/image/public/')) {
    event.respondWith(staleWhileRevalidate(request, IMAGES, MAX_IMAGES))
  }
})

async function networkFirst(request) {
  const cache = await caches.open(PAGES)
  const network = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone())
    return response
  })
  try {
    return await withTimeout(network, 3000)
  } catch {
    // Slow or offline: use the saved copy if there is one, otherwise keep waiting on the network.
    const cached = await cache.match(request, { ignoreSearch: true })
    if (cached) return cached
    try {
      return await network
    } catch {
      return (
        (await cache.match('/app-shell.html')) ||
        new Response('You appear to be offline.', { status: 503, headers: { 'Content-Type': 'text/plain' } })
      )
    }
  }
}

async function cacheFirst(request, name, max) {
  const cache = await caches.open(name)
  const hit = await cache.match(request)
  if (hit) return hit
  const response = await fetch(request)
  if (response.ok) {
    await cache.put(request, response.clone())
    trim(cache, max)
  }
  return response
}

async function staleWhileRevalidate(request, name, max) {
  const cache = await caches.open(name)
  const hit = await cache.match(request)
  const refresh = fetch(request)
    .then((response) => {
      // Only CORS responses: opaque ones can't be checked and use a lot of storage quota.
      if (response.ok) {
        cache.put(request, response.clone()).then(() => trim(cache, max))
      }
      return response
    })
    .catch(() => hit)
  return hit || refresh
}

async function trim(cache, max) {
  const keys = await cache.keys()
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i])
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      }
    )
  })
}
