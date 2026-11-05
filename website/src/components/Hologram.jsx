/**
 * Hologram: shows a graphic as if it were projected — iridescent sheen, scanlines, a sweeping
 * gold beam, a soft flicker, a gentle float and a projector glow underneath. On computers it
 * leans toward the mouse through the site's existing .tilt system (src/lib/depth.js).
 * Styles are in the "Holograms" section of src/index.css; visitors who reduce motion get a still image.
 *
 *   <Hologram src="/graphics/founders-1911.webp" alt="..." />          framed card
 *   <Hologram src="/graphics/que-dog.webp" alt="..." cutout />         transparent graphic, no frame
 *   size: "sm" | "md" (default) | "lg"
 */
export default function Hologram({ src, alt = '', size = 'md', cutout = false, className = '', width, height }) {
  return (
    <figure className={`holo holo-${size} ${cutout ? 'holo-cutout' : ''} ${className}`} style={{ '--holo-mask': `url("${src}")` }}>
      <div className="holo-card tilt no-sheen">
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          aria-hidden={alt ? undefined : 'true'}
          className="holo-img"
        />
        <span className="holo-sheen" aria-hidden="true" />
        <span className="holo-scan" aria-hidden="true" />
      </div>
      <span className="holo-base" aria-hidden="true" />
    </figure>
  )
}
