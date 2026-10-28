// Route table: one place that knows each page's code chunk, so the site can
//   - split every page into its own file (visitors only download the page they open),
//   - preload a page's code when a visitor hovers or taps its link,
//   - prefetch likely next pages while the browser is idle,
//   - and tell the build step which chunk each prerendered page needs (<link rel="modulepreload">).

import { lazy } from 'react'
import { committees } from './data/placeholders'
import { normalize } from './lib/paths'

export { normalize }

function lazyPage(file, loader) {
  const Component = lazy(loader)
  Component.preload = loader
  Component.file = file
  return Component
}

// Home ships in the main bundle: it is the most common landing page.
export { default as Home } from './pages/Home'

export const About = lazyPage('src/pages/About.jsx', () => import('./pages/About'))
export const Founders = lazyPage('src/pages/Founders.jsx', () => import('./pages/Founders'))
export const Events = lazyPage('src/pages/Events.jsx', () => import('./pages/Events'))
export const Media = lazyPage('src/pages/Media.jsx', () => import('./pages/Media'))
export const Committees = lazyPage('src/pages/committees/Committees.jsx', () => import('./pages/committees/Committees'))
export const CommitteeDetail = lazyPage('src/pages/committees/CommitteeDetail.jsx', () => import('./pages/committees/CommitteeDetail'))
export const BrothersLogin = lazyPage('src/pages/brothers/Login.jsx', () => import('./pages/brothers/Login'))
export const BrothersDashboard = lazyPage('src/pages/brothers/Dashboard.jsx', () => import('./pages/brothers/Dashboard'))
export const News = lazyPage('src/pages/News.jsx', () => import('./pages/News'))
export const ChapterHouse = lazyPage('src/pages/ChapterHouse.jsx', () => import('./pages/ChapterHouse'))
export const EssayContest = lazyPage('src/pages/EssayContest.jsx', () => import('./pages/EssayContest'))
export const AchievementWeek = lazyPage('src/pages/AchievementWeek.jsx', () => import('./pages/AchievementWeek'))
export const EssayApply = lazyPage('src/pages/EssayApply.jsx', () => import('./pages/EssayApply'))
export const Status = lazyPage('src/pages/Status.jsx', () => import('./pages/Status'))
export const NotFound = lazyPage('src/pages/NotFound.jsx', () => import('./pages/NotFound'))

/** Which lazy page component serves a pathname (null for Home). */
export function pageForPath(pathname) {
  const p = normalize(pathname)
  if (p === '/') return null
  if (p === '/about') return About
  if (p === '/founders') return Founders
  if (p === '/events') return Events
  if (p === '/media') return Media
  if (p === '/news') return News
  if (p === '/chapter-house') return ChapterHouse
  if (p === '/achievement-week') return AchievementWeek
  if (p === '/essay-contest') return EssayContest
  if (p === '/essay-contest/apply') return EssayApply
  if (p === '/status') return Status
  if (p === '/committees') return Committees
  if (p.startsWith('/committees/')) return CommitteeDetail
  if (p === '/brothers/login') return BrothersLogin
  if (p === '/brothers') return BrothersDashboard
  return NotFound
}

export function preloadPath(pathname) {
  const page = pageForPath(pathname)
  return page ? page.preload().catch(() => {}) : Promise.resolve()
}


/** Public pages that get prerendered to static HTML and listed in the sitemap. */
export const publicPaths = [
  '/',
  '/about',
  '/founders',
  '/events',
  '/committees',
  ...committees.map((c) => `/committees/${c.slug}`),
  '/media',
  '/news',
  '/chapter-house',
  '/achievement-week',
  '/essay-contest',
]

/** Pages prerendered for speed but kept out of search results. */
export const privatePrerenderPaths = ['/essay-contest/apply', '/brothers/login', '/brothers', '/status']

/** Pages visitors most often go to next; prefetched while the browser is idle. */
export const likelyNext = ['/events', '/about', '/committees', '/media']
