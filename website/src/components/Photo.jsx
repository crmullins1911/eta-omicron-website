/**
 * A photo from src/data/sitePhotos.js, or a designed placeholder tile until one is supplied.
 */
export default function Photo({ photo, className = '', eager = false, tone = 'plum' }) {
  if (photo?.src) {
    return (
      <img
        src={photo.src}
        alt={photo.alt || ''}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : undefined}
        decoding="async"
        className={`rounded object-cover ${className}`}
      />
    )
  }
  return (
    <div
      aria-hidden="true"
      className={`rounded flex items-end p-5 ${tone === 'light' ? 'bg-plum-light' : 'bg-plum'} ${className}`}
    >
      <span className="font-display italic text-3xl text-gold/80 leading-none">{photo?.fallback}</span>
    </div>
  )
}
