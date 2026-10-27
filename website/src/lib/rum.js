// Real-user monitoring (RUM).
//
// Measures how the site actually performs and gets used by real visitors, and stores it in the
// Supabase table "rum_events" (see supabase/migrations/20261023_rum_events.sql):
//
//   page_view   - each page a visitor opens (path, referrer, device class, connection type)
//   vital       - Core Web Vitals per page load: LCP, INP, CLS, plus FCP and TTFB
//   engagement  - on leaving a page: visible time, deepest scroll %, number of interactions
//   click       - clicks on links/buttons (label from data-track, link target or button text)
//   error       - uncaught JavaScript errors and promise rejections
//
// Privacy: no names, emails, IP addresses or form contents are collected. A visitor gets a random
// ID stored in their browser; a session gets a random ID that resets when the tab closes. Visitors
// who send Global Privacy Control or Do Not Track are not tracked at all.
//
// Events are batched and sent every 10 s, and on leaving the page with fetch(keepalive).

import { SUPABASE_URL, supabaseConfigured, supabaseHeaders } from './rest'
import { normalize } from './paths'

const ENDPOINT = `${SUPABASE_URL}/rest/v1/rum_events`
const SAMPLE_RATE = Number(import.meta.env.VITE_RUM_SAMPLE_RATE ?? 1) // 0..1, share of sessions tracked
const FLUSH_MS = 10_000
const MAX_BATCH = 40

let enabled = false
let queue = []
let flushTimer = null
let sessionId = null
let visitorId = null
let pendingPageView = null // page view recorded before init (first paint happens before RUM loads)

const page = { path: null, startedAt: 0, visibleMs: 0, visibleSince: 0, maxScroll: 0, interactions: 0 }

// ---- setup --------------------------------------------------------------------------------------

export function initRum() {
  if (enabled || typeof window === 'undefined') return
  if (!supabaseConfigured || optedOut() || !sampled()) return
  enabled = true

  visitorId = stored(localStorage, 'eo:rum:vid')
  sessionId = stored(sessionStorage, 'eo:rum:sid')

  if (pendingPageView) startPage(pendingPageView)
  else startPage(normalize(location.pathname))

  earlyIssues.splice(0).forEach((m) => onError(m, 'hydration'))
  watchVitals()
  window.addEventListener('scroll', onScroll, { passive: true })
  document.addEventListener('click', onClick, { capture: true, passive: true })
  document.addEventListener('keydown', () => page.interactions++, { passive: true })
  window.addEventListener('error', (e) => onError(e.message, e.filename, e.lineno))
  window.addEventListener('unhandledrejection', (e) => onError(String(e.reason?.message || e.reason), 'promise'))
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('pagehide', () => endPage(true))
}

function optedOut() {
  try {
    return navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1'
  } catch {
    return false
  }
}

function sampled() {
  try {
    const key = 'eo:rum:sampled'
    let v = sessionStorage.getItem(key)
    if (v === null) {
      v = Math.random() < SAMPLE_RATE ? '1' : '0'
      sessionStorage.setItem(key, v)
    }
    return v === '1'
  } catch {
    return Math.random() < SAMPLE_RATE
  }
}

function stored(store, key) {
  try {
    let id = store.getItem(key)
    if (!id) {
      id = randomId()
      store.setItem(key, id)
    }
    return id
  } catch {
    return randomId()
  }
}

function randomId() {
  return crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ---- pages ------------------------------------------------------------------------------------

/** Called by Layout on every route change. */
export function trackPageView(pathname) {
  const path = normalize(pathname)
  if (!enabled) {
    pendingPageView = path
    return
  }
  if (path === page.path) return
  endPage(false)
  startPage(path)
}

function startPage(path) {
  const first = page.path === null
  page.path = path
  page.startedAt = performance.now()
  page.visibleMs = 0
  page.visibleSince = document.visibilityState === 'visible' ? performance.now() : 0
  page.maxScroll = scrollPct()
  page.interactions = 0

  const nav = first ? performance.getEntriesByType('navigation')[0] : null
  push('page_view', {
    data: {
      referrer: first ? referrerHost() : 'internal',
      nav_type: first ? nav?.type || 'navigate' : 'spa',
      device: deviceClass(),
      connection: navigator.connection?.effectiveType || null,
      prerendered: first ? Boolean(window.__EO_SEED__) : undefined,
      sw: Boolean(navigator.serviceWorker?.controller),
    },
  })
}

// Engagement is reported in segments: whenever the page is hidden (tab switch, app switch, close)
// and when the visitor navigates away. Mobile browsers often never fire "pagehide", so waiting for
// the very end would lose most of it. The dashboard sums the segments per page view.
function reportSegment(leaving) {
  if (!page.path) return
  if (page.visibleSince) page.visibleMs += performance.now() - page.visibleSince
  page.visibleSince = 0
  if (page.visibleMs >= 250 || page.interactions > 0) {
    push('engagement', {
      value: Math.round(page.visibleMs),
      data: { visible_ms: Math.round(page.visibleMs), max_scroll: page.maxScroll, interactions: page.interactions },
    })
  }
  page.visibleMs = 0
  page.interactions = 0
  if (leaving) flush(true)
}

function endPage(leaving) {
  reportSegment(leaving)
}

function onVisibility() {
  if (document.visibilityState === 'hidden') {
    reportSegment(true)
  } else {
    page.visibleSince = performance.now()
  }
}

function onScroll() {
  const pct = scrollPct()
  if (pct > page.maxScroll) page.maxScroll = pct
}

function scrollPct() {
  const doc = document.documentElement
  const max = doc.scrollHeight - window.innerHeight
  return max <= 0 ? 100 : Math.min(100, Math.round((window.scrollY / max) * 100))
}

function onClick(e) {
  page.interactions++
  const el = e.target.closest?.('a, button, [data-track]')
  if (!el) return
  const label =
    el.getAttribute('data-track') ||
    el.getAttribute('aria-label') ||
    (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60) ||
    el.tagName.toLowerCase()
  const href = el.tagName === 'A' ? el.getAttribute('href') : null
  push('click', {
    name: label,
    data: {
      href: href && !href.startsWith('mailto:') ? href.slice(0, 200) : null,
      external: href ? /^https?:/.test(href) && !href.includes(location.host) : false,
      section: el.closest('[data-track-section]')?.getAttribute('data-track-section') || null,
    },
  })
}

const earlyIssues = [] // reported before monitoring started (hydration happens first)

/** Called from main.jsx when React had to re-render part of a prerendered page. */
export function reportHydrationIssue(error) {
  const message = 'Hydration mismatch: ' + String(error?.message || error).slice(0, 200)
  if (enabled) onError(message, 'hydration')
  else if (earlyIssues.length < 5) earlyIssues.push(message)
}

let errorCount = 0
function onError(message, source, line) {
  if (++errorCount > 10) return // don't flood on a loop
  push('error', { name: String(message || 'Unknown error').slice(0, 300), data: { source: String(source || '').slice(0, 200), line: line || null } })
}

// ---- web vitals ---------------------------------------------------------------------------------

function watchVitals() {
  // Loaded as a separate small chunk so it never delays the page's own code.
  import('web-vitals').then(({ onLCP, onINP, onCLS, onFCP, onTTFB }) => {
    const landing = page.path
    const report = (m) =>
      push('vital', {
        name: m.name,
        value: m.name === 'CLS' ? Math.round(m.value * 1000) / 1000 : Math.round(m.value),
        rating: m.rating,
        path: landing,
        data: { nav_type: m.navigationType },
      })
    onLCP(report)
    onINP(report)
    onCLS(report)
    onFCP(report)
    onTTFB(report)
  })
}

// ---- transport ----------------------------------------------------------------------------------

function push(type, { name = null, value = null, rating = null, path = page.path, data = {} } = {}) {
  if (!enabled) return
  queue.push({ session_id: sessionId, visitor_id: visitorId, type, path, name, value, rating, data })
  if (queue.length >= MAX_BATCH) flush(false)
  else if (!flushTimer) flushTimer = setTimeout(() => flush(false), FLUSH_MS)
}

function flush(leaving) {
  clearTimeout(flushTimer)
  flushTimer = null
  if (!queue.length) return
  const batch = queue.splice(0, MAX_BATCH)
  try {
    fetch(ENDPOINT, {
      method: 'POST',
      keepalive: leaving, // lets the request finish after the tab closes (64 KB limit)
      headers: supabaseHeaders({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
      body: JSON.stringify(batch),
    }).catch(() => {})
  } catch {
    /* never let monitoring break the page */
  }
  if (queue.length) flush(leaving)
}

// ---- helpers ------------------------------------------------------------------------------------

function deviceClass() {
  const w = window.innerWidth
  return w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop'
}

function referrerHost() {
  try {
    if (!document.referrer) return 'direct'
    const host = new URL(document.referrer).host
    return host === location.host ? 'internal' : host
  } catch {
    return 'direct'
  }
}
