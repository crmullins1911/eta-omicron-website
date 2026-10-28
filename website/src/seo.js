// Search engine metadata for every page: titles, descriptions, canonical URLs, social cards and
// structured data (JSON-LD). Used by the <Seo> component in the browser and by the build step,
// which writes the same tags into each page's static HTML so crawlers see them without JavaScript.

import { committees } from './data/placeholders'
import { normalize } from './lib/paths'

export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://etaomicron.org').replace(/\/$/, '')
export const ORG_NAME = 'Eta Omicron Chapter of Omega Psi Phi Fraternity, Inc.'
const SUFFIX = ' | Eta Omicron Chapter, Omega Psi Phi'
const DEFAULT_DESCRIPTION =
  'Official website of the Eta Omicron Chapter of Omega Psi Phi Fraternity, Inc. Chapter news, events, committees and media.'

const pages = {
  '/': {
    title: 'Eta Omicron Chapter | Omega Psi Phi Fraternity, Inc.',
    description:
      'The Eta Omicron Chapter of Omega Psi Phi Fraternity, Inc.: Manhood, Scholarship, Perseverance and Uplift. Chapter news, upcoming events and community programs.',
    crumbs: [],
  },
  '/about': {
    title: 'About Us' + SUFFIX,
    description: 'The history, leadership and guiding principles of the Eta Omicron Chapter of Omega Psi Phi Fraternity, Inc.',
    crumbs: ['About Us'],
  },
  '/founders': {
    title: 'Our Founders' + SUFFIX,
    description:
      'Edgar Amos Love, Oscar James Cooper, Frank Coleman and Ernest Everett Just founded Omega Psi Phi Fraternity, Inc. at Howard University on November 17, 1911.',
    crumbs: ['Founders'],
  },
  '/events': {
    title: 'Events' + SUFFIX,
    description: 'Upcoming chapter events, community service days and the Talent Hunt scholarship competition from the Eta Omicron Chapter.',
    crumbs: ['Events'],
  },
  '/committees': {
    title: 'Committees' + SUFFIX,
    description: 'Eta Omicron Chapter committees and their forms, applications and posts.',
    crumbs: ['Committees'],
  },
  '/media': {
    title: 'Media' + SUFFIX,
    description: 'Photos and videos from Eta Omicron Chapter events and community service.',
    crumbs: ['Media'],
  },
  '/news': {
    title: 'News' + SUFFIX,
    description: 'Announcements, stories and updates from the Eta Omicron Chapter of Omega Psi Phi Fraternity, Inc.',
    crumbs: ['News'],
  },
  '/chapter-house': {
    title: 'Chapter House' + SUFFIX,
    description: 'Location, hours, meetings and contact information for the Eta Omicron Chapter House.',
    crumbs: ['Chapter House'],
  },
  '/achievement-week': {
    title: 'Achievement Week 2026' + SUFFIX,
    description:
      'Achievement Week 2026 (November 15–21) with the Eta Omicron Chapter of Omega Psi Phi: worship, fellowship, a candlelight vigil, the Charles R. Drew Blood Drive, STEM, mentoring and Project UPLIFT.',
    crumbs: [{ label: 'Committees', path: '/committees' }, { label: 'Achievement Week', path: '/committees/achievement-week' }, 'Schedule'],
  },
  '/essay-contest': {
    title: 'High School Essay Contest' + SUFFIX,
    description:
      'Omega Psi Phi International High School Essay Contest: this year\'s topic, deadline, scholarship awards, rules and the application to download. Open to college-bound high school seniors.',
    crumbs: [{ label: 'Committees', path: '/committees' }, { label: 'Achievement Week', path: '/committees/achievement-week' }, 'Essay Contest'],
  },
  '/essay-contest/apply': {
    title: 'Apply Online: High School Essay Contest' + SUFFIX,
    description: 'Online application for the Omega Psi Phi International High School Essay Contest, sent to the Eta Omicron Chapter.',
    noindex: true,
    crumbs: [{ label: 'Essay Contest', path: '/essay-contest' }, 'Apply online'],
  },
  '/status': {
    title: 'Website Status' + SUFFIX,
    description: 'Website diagnostics.',
    noindex: true,
    crumbs: [],
  },
  '/brothers/login': {
    title: 'Brothers Only Sign In' + SUFFIX,
    description: 'Member sign-in for the Eta Omicron Chapter.',
    noindex: true,
    crumbs: ['Brothers Only'],
  },
  '/brothers': {
    title: 'Brothers Only' + SUFFIX,
    description: 'Member area for the Eta Omicron Chapter.',
    noindex: true,
    crumbs: ['Brothers Only'],
  },
}

export function metaFor(pathname) {
  const path = normalize(pathname)
  let meta = pages[path]

  if (!meta && path.startsWith('/committees/')) {
    const c = committees.find((x) => `/committees/${x.slug}` === path)
    if (c) {
      meta = {
        title: c.name + SUFFIX,
        description: c.description,
        crumbs: [{ label: 'Committees', path: '/committees' }, c.name],
      }
    }
  }

  if (!meta) {
    return { title: 'Page Not Found' + SUFFIX, description: DEFAULT_DESCRIPTION, noindex: true, canonical: null, path, crumbs: [] }
  }

  return { description: DEFAULT_DESCRIPTION, ...meta, path, canonical: SITE_URL + (path === '/' ? '/' : path) }
}

/** Structured data for a page. `data` holds the page's loaded data (e.g. { events }). */
export function jsonLdFor(pathname, data = {}) {
  const meta = metaFor(pathname)
  const blocks = [organization()]

  if (meta.crumbs.length) {
    const items = [{ name: 'Home', item: SITE_URL + '/' }]
    meta.crumbs.forEach((c, i) => {
      const last = i === meta.crumbs.length - 1
      if (typeof c === 'string') items.push({ name: c, item: last ? meta.canonical : undefined })
      else items.push({ name: c.label, item: SITE_URL + c.path })
    })
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, ...(x.item && { item: x.item }) })),
    })
  }

  if ((meta.path === '/events' || meta.path === '/') && data.events?.length) {
    data.events.forEach((e) => blocks.push(eventLd(e)))
  }

  return blocks
}

function organization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: ORG_NAME,
    alternateName: 'Eta Omicron Chapter',
    url: SITE_URL + '/',
    logo: SITE_URL + '/brand/crest-192.png',
    email: 'EtaOmicronQues@gmail.com',
    parentOrganization: { '@type': 'Organization', name: 'Omega Psi Phi Fraternity, Inc.' },
  }
}

function eventLd(e) {
  const start = e.time && /^\d{2}:\d{2}/.test(e.time) ? `${e.date}T${e.time.slice(0, 5)}` : e.date
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: e.title,
    startDate: start,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    ...(e.description && { description: e.description }),
    location: { '@type': 'Place', name: e.location || 'To be announced', address: e.location || 'To be announced' },
    organizer: { '@type': 'Organization', name: ORG_NAME, url: SITE_URL + '/' },
    url: SITE_URL + '/events#' + eventSlug(e),
  }
}

export function eventSlug(e) {
  return `${e.date}-${String(e.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
}

/** Head tags as an HTML string, for the build step. */
export function headTagsHtml(pathname, data) {
  const m = metaFor(pathname)
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
  const tags = [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    m.noindex ? `<meta name="robots" content="noindex, nofollow" />` : `<meta name="robots" content="index, follow, max-image-preview:large" />`,
    m.canonical && `<link rel="canonical" href="${esc(m.canonical)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Eta Omicron Chapter" />`,
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    m.canonical && `<meta property="og:url" content="${esc(m.canonical)}" />`,
    `<meta property="og:image" content="${SITE_URL}/brand/crest-192.png" />`,
    `<meta property="og:image:alt" content="Omega Psi Phi Fraternity, Inc. crest" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${esc(m.title)}" />`,
    `<meta name="twitter:description" content="${esc(m.description)}" />`,
    `<script type="application/ld+json" id="ld-json">${safeJson(jsonLdFor(pathname, data))}</script>`,
  ]
  return tags.filter(Boolean).join('\n    ')
}

/** JSON that is safe to place inside a <script> tag. */
export function safeJson(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
}
