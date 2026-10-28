import { useEffect, useRef } from 'react'
import { sitePhotos } from '../data/sitePhotos'
import useSiteContent from '../hooks/useSiteContent'

/**
 * Full-width chapter photo or video band on the home page. Set it in Supabase (site_content rows
 * starting "home_feature_"); src/data/sitePhotos.js is the fallback. A link ending in .mp4/.mov/.webm
 * is treated as a video.
 *
 * A video plays muted and looping only while it's on screen, never for visitors who ask for
 * reduced motion (they see the poster image), and doesn't download until it's about to be seen.
 * Until media is supplied, a designed band with the chapter's motto is shown instead.
 */
export default function ChapterVisual() {
  const c = useSiteContent()
  const media = c.home_feature_url
    ? {
        type: /\.(mp4|mov|webm)(\?|#|$)/i.test(c.home_feature_url) ? 'video' : 'image',
        src: c.home_feature_url,
        poster: c.home_feature_poster || '',
        alt: c.home_feature_alt || '',
        caption: c.home_feature_caption || sitePhotos.feature.caption,
      }
    : { ...sitePhotos.feature, caption: c.home_feature_caption || sitePhotos.feature.caption }
  const videoRef = useRef(null)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) v.play().catch(() => {})
        else v.pause()
      },
      { threshold: 0.25 }
    )
    io.observe(v)
    return () => io.disconnect()
  }, [media.type, media.src])

  const caption = media?.caption || 'Brothers in service.'

  return (
    <figure className="depth-frame reveal relative overflow-hidden rounded-lg border border-gold/35 bg-plum aspect-[16/9] md:aspect-[21/9]">
      {media?.type === 'video' && media.src ? (
        <video
          ref={videoRef}
          src={media.src}
          poster={media.poster || undefined}
          muted
          loop
          playsInline
          preload="none"
          aria-label={media.alt || caption}
          className="depth-photo absolute inset-0 h-full w-full object-cover"
        />
      ) : media?.src ? (
        <img
          src={media.src}
          alt={media.alt || ''}
          loading="lazy"
          decoding="async"
          className="depth-photo absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <img
          src="/brand/eta-omicron-720.webp"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="depth-photo absolute right-[-4%] top-1/2 -translate-y-1/2 h-[130%] w-auto opacity-[0.12]"
        />
      )}

      {/* Readability shade behind the caption (only over real media). */}
      {media?.src && <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-night/70 [mask-image:linear-gradient(to_top,black,transparent)]" />}

      <figcaption className="absolute left-0 bottom-0 p-6 md:p-10">
        <p className="eyebrow">Eta Omicron Chapter</p>
        <p className="mt-2 font-display text-3xl md:text-5xl font-semibold italic text-ink">{caption}</p>
      </figcaption>
    </figure>
  )
}
