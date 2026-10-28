import { Link } from 'react-router-dom'
import useCachedQuery from '../hooks/useCachedQuery'
import { mediaQuery } from '../lib/queries'
import { intent } from '../lib/prefetch'

/**
 * Auto-scrolling strip of chapter photos on the home page.
 *
 * Uses the same photos as the Media page (Supabase "media_items", newest first), so anything added
 * there shows up here too. The row is rendered twice and slid left by half its width, so it loops
 * without a jump. It pauses while hovered or focused, and visitors who ask for reduced motion get
 * a still row they can swipe instead (see "Photo strip" in index.css). Hidden until real photos exist.
 */
const MAX_PHOTOS = 12
const SECONDS_PER_PHOTO = 5

export default function PhotoStrip() {
  const { data: items } = useCachedQuery(mediaQuery)
  const photos = items.filter((m) => m.type !== 'video' && m.url).slice(0, MAX_PHOTOS)
  if (photos.length < 3) return null

  const tile = (m, i, copy) => (
    <li key={`${copy}-${m.url}`} className="photo-strip-item" aria-hidden={copy ? 'true' : undefined}>
      <Link
        to="/media"
        {...intent('/media')}
        tabIndex={copy ? -1 : undefined}
        data-track="home: photo strip"
        className="block h-full w-full overflow-hidden rounded-lg border border-gold/25 bg-plum"
      >
        <img
          src={m.url}
          alt={copy ? '' : m.title}
          crossOrigin="anonymous"
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </Link>
    </li>
  )

  return (
    <div className="pt-20">
      <div className="container-page mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Chapter life</p>
          <h2 className="mt-2 font-display text-3xl md:text-4xl font-semibold">Moments from the chapter</h2>
        </div>
        <Link
          to="/media"
          {...intent('/media')}
          data-track="home: photo strip all"
          className="font-semibold text-gold hover:text-gold-light"
        >
          See all photos →
        </Link>
      </div>

      <div className="photo-strip" role="region" aria-label="Chapter photos">
        <ul className="photo-strip-track" style={{ '--strip-duration': `${photos.length * SECONDS_PER_PHOTO}s` }}>
          {photos.map((m, i) => tile(m, i, false))}
          {photos.map((m, i) => tile(m, i, true))}
        </ul>
      </div>
    </div>
  )
}
