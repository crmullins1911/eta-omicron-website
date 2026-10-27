import { Link } from 'react-router-dom'

/**
 * PageBanner: the title block at the top of inner pages (eyebrow breadcrumb, serif title,
 * short description), in the Editorial Night style.
 *
 *   <PageBanner
 *     title="Events"
 *     subtitle="Optional one-line description."
 *     breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Events' }]}
 *   />
 */
export default function PageBanner({ title, subtitle, breadcrumb = [] }) {
  return (
    <section className="depth-banner relative overflow-hidden border-b border-gold/35">
      {/* Back layer: a faint chapter emblem that drifts slower than the page as it scrolls. */}
      <img
        src="/brand/eta-omicron-360.webp"
        alt=""
        aria-hidden="true"
        width="360"
        height="333"
        decoding="async"
        fetchPriority="low"
        className="depth-back pointer-events-none absolute right-[4%] top-1/2 hidden h-[150%] w-auto -translate-y-1/2 opacity-[0.07] md:block"
      />
      <div className="depth-front relative container-page pt-16 pb-12 md:pt-20 md:pb-14">
        {breadcrumb.length > 0 && (
          <nav aria-label="Breadcrumb" className="eyebrow">
            {breadcrumb.map((crumb, i) => (
              <span key={i}>
                {crumb.to ? (
                  <Link to={crumb.to} className="hover:text-gold-light">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page">{crumb.label}</span>
                )}
                {i < breadcrumb.length - 1 && <span className="mx-2 opacity-60">/</span>}
              </span>
            ))}
          </nav>
        )}
        <h1 className="mt-4 font-display text-5xl md:text-6xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink/75">{subtitle}</p>}
      </div>
    </section>
  )
}
