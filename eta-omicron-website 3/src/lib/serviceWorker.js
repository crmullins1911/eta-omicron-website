// Registers public/sw.js, the service worker that keeps the site's files and images cached on the
// visitor's device (see that file for the caching rules). Add ?sw=off to any URL to remove it from
// that browser, e.g. when debugging a stale page.

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  if (new URLSearchParams(location.search).get('sw') === 'off') {
    navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((r) => r.unregister()))
    caches?.keys().then((keys) => keys.filter((k) => k.startsWith('eo-')).forEach((k) => caches.delete(k)))
    return
  }

  navigator.serviceWorker.register('/sw.js').catch(() => {})
}
