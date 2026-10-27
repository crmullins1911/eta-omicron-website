import { Suspense, useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import LazyHydrate from './LazyHydrate'
import Seo from './Seo'
import { endHydration } from '../lib/hydration'
import { prefetchLikelyPagesWhenIdle } from '../lib/prefetch'
import { trackPageView } from '../lib/rum'
import { normalize } from '../lib/paths'

const OWN_LD = new Set(['/', '/events'])

export default function Layout() {
  const { pathname, hash, key } = useLocation()
  const firstRender = useRef(true)
  const landingKey = useRef(key)

  // The visitor navigated within the site: stop deferring hydration. This runs during render (not in
  // an effect) so sections still waiting to hydrate render normally in this same pass.
  if (key !== landingKey.current) endHydration()

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      prefetchLikelyPagesWhenIdle(pathname)
    } else if (!hash) {
      window.scrollTo(0, 0)
    }
    if (hash) scrollToHash(hash)
    trackPageView(pathname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, hash])

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-gold focus:text-night focus:px-3 focus:py-2 focus:rounded">
        Skip to content
      </a>
      <Navbar />
      {/* Home and Events add their own event structured data (see those pages). */}
      <Seo path={pathname} ld={!OWN_LD.has(normalize(pathname))} />
      <main id="main" className="flex-1">
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <LazyHydrate id="footer" className="cv-auto" component={Footer} />
    </div>
  )
}

// Links like /about#leadership: scroll to that section once the page has rendered.
function scrollToHash(hash) {
  let tries = 0
  const attempt = () => {
    const el = document.getElementById(decodeURIComponent(hash.slice(1)))
    if (el) el.scrollIntoView({ block: 'start' })
    else if (tries++ < 20) setTimeout(attempt, 50)
  }
  requestAnimationFrame(attempt)
}

function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading page">
      <div className="border-b border-gold/35 h-44 md:h-52" />
      <div className="container-page py-14 space-y-4">
        <div className="skeleton h-6 w-1/3" />
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-24 w-full" />
      </div>
    </div>
  )
}
