import { useEffect, useRef } from 'react'

/** Full-screen media viewer: arrow keys / swipe to move, Esc or backdrop click to close. */
export default function Lightbox({ items, index, onChange, onClose }) {
  const item = items[index]
  const closeRef = useRef(null)
  const touchX = useRef(null)
  const count = items.length

  const prev = () => onChange((index - 1 + count) % count)
  const next = () => onChange((index + 1) % count)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
    }
  })

  // Warm the neighbouring photos so arrowing through feels instant.
  useEffect(() => {
    ;[items[(index + 1) % count], items[(index - 1 + count) % count]].forEach((m) => {
      if (m?.type !== 'video' && m?.url) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = m.url
      }
    })
  }, [index, items, count])

  if (!item) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 50) (dx > 0 ? prev : next)()
        touchX.current = null
      }}
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl leading-none px-2"
      >
        &times;
      </button>

      {item.type === 'video' ? (
        <video src={item.url} controls autoPlay className="max-h-[80vh] max-w-full rounded" />
      ) : (
        <img src={item.url} alt={item.title} crossOrigin="anonymous" className="max-h-[80vh] max-w-full object-contain rounded" />
      )}
      <p className="mt-3 text-white/90 text-sm">
        {item.title} <span className="text-white/50">({index + 1} of {count})</span>
      </p>

      {count > 1 && (
        <>
          <button type="button" onClick={prev} aria-label="Previous" className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl px-3">
            &#8249;
          </button>
          <button type="button" onClick={next} aria-label="Next" className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl px-3">
            &#8250;
          </button>
        </>
      )}
    </div>
  )
}
