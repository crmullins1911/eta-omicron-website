import { useMemo } from 'react';
import './FloatingPhotos.css';

/**
 * FloatingPhotos
 *
 * Renders a set of photos that slowly drift around behind the home page
 * content. Each photo gets a randomized starting position, drift path,
 * size, and speed so they don't all move in sync.
 *
 * Usage:
 *   <FloatingPhotos images={[url1, url2, url3, ...]} />
 *
 * Wrap your home page content in a positioned container and place
 * <FloatingPhotos /> as the first child so it sits behind everything else:
 *
 *   <div style={{ position: 'relative' }}>
 *     <FloatingPhotos images={photos} />
 *     <div style={{ position: 'relative', zIndex: 1 }}>
 *        ...rest of home page...
 *     </div>
 *   </div>
 */

export default function FloatingPhotos({ images = [] }) {
  // Randomize each photo's layout once per mount (not on every re-render)
  const photoSettings = useMemo(() => {
    return images.map((src) => ({
      src,
      top: Math.random() * 80 + 5, // % from top
      left: Math.random() * 80 + 5, // % from left
      size: Math.random() * 60 + 90, // px, between 90-150
      duration: Math.random() * 20 + 20, // seconds, between 20-40s
      delay: Math.random() * -30, // negative delay so they don't all start in sync
      driftX: Math.random() * 120 - 60, // px drift range
      driftY: Math.random() * 120 - 60,
      rotate: Math.random() * 16 - 8, // degrees
    }));
  }, [images]);

  if (!images.length) return null;

  return (
    <div className="floating-photos" aria-hidden="true">
      {photoSettings.map((photo, i) => (
        <img
          key={i}
          src={photo.src}
          alt=""
          className="floating-photo"
          style={{
            top: `${photo.top}%`,
            left: `${photo.left}%`,
            width: `${photo.size}px`,
            height: `${photo.size}px`,
            animationDuration: `${photo.duration}s`,
            animationDelay: `${photo.delay}s`,
            // custom properties consumed by the keyframes in FloatingPhotos.css
            '--drift-x': `${photo.driftX}px`,
            '--drift-y': `${photo.driftY}px`,
            '--rotate': `${photo.rotate}deg`,
          }}
        />
      ))}
    </div>
  );
}
