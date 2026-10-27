import { lazy, Suspense, useState } from 'react'
import PageBanner from '../components/PageBanner'
import useCachedQuery from '../hooks/useCachedQuery'
import { mediaQuery } from '../lib/queries'

// Photos/videos live in a Supabase Storage bucket ("media") with metadata in the "media_items"
// table (title, type ["image"|"video"], url). Falls back to placeholder tiles when empty.
//
// Images load lazily as they approach the viewport; the first row loads eagerly. The full-screen
// viewer is a separate code chunk that only downloads when someone opens a photo.

const Lightbox = lazy(() => import('../components/Lightbox'))
const EAGER = 3

export default function Media() {
  const { data: items, source } = useCachedQuery(mediaQuery)
  const [open, setOpen] = useState(null) // index of the item being viewed
  const viewable = items.filter((m) => m.url)

  return (
    <div>
      <PageBanner
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Media' }]}
        title="Media"
        subtitle="Photos and videos from our chapter events."
      />

      <section className="container-page py-14" data-track-section="media">
        {source === 'fallback' && (
          <p className="text-sm text-ink/60 mb-6 italic">
            Showing placeholder gallery items. Connect Supabase Storage + a "media_items" table to manage this live.
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m, i) => (
            <figure key={m.url || m.title} className="reveal tilt rounded-lg overflow-hidden border border-ink/10 bg-plum/60">
              <div className="aspect-video bg-plum flex items-center justify-center text-ink/50 text-sm">
                {m.url ? (
                  m.type === 'video' ? (
                    <video src={m.url} controls preload="metadata" className="w-full h-full object-cover" />
                  ) : (
                    <button
                      type="button"
                      className="w-full h-full cursor-zoom-in"
                      onClick={() => setOpen(viewable.indexOf(m))}
                      onMouseEnter={() => import('../components/Lightbox')}
                      aria-label={`View ${m.title}`}
                      data-track="media: open photo"
                    >
                      <img
                        src={m.url}
                        alt={m.title}
                        crossOrigin="anonymous"
                        loading={i < EAGER ? 'eager' : 'lazy'}
                        fetchPriority={i === 0 ? 'high' : undefined}
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  )
                ) : (
                  <span>{m.type === 'video' ? 'Video placeholder' : 'Photo placeholder'}</span>
                )}
              </div>
              <figcaption className="p-3 font-semibold text-sm">{m.title}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {open !== null && (
        <Suspense fallback={null}>
          <Lightbox items={viewable} index={open} onChange={setOpen} onClose={() => setOpen(null)} />
        </Suspense>
      )}
    </div>
  )
}
