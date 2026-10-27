import { Link } from 'react-router-dom'

/**
 * PageBanner
 *
 * The purple diagonal title banner (title + breadcrumb) that sits BELOW
 * your existing <Navbar />, on inner pages -- e.g. "Essay Contest",
 * "Programs". It does not duplicate navigation; Navbar already handles that.
 *
 * Usage (inside a page component, above your page content):
 *   <PageBanner
 *     title="Programs"
 *     breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Programs' }]}
 *   />
 */
export default function PageBanner({ title, breadcrumb = [] }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-omega-purple to-omega-purple-dark text-white">
      {/* diagonal accent shapes, matching the reference banner */}
      <div className="pointer-events-none absolute inset-y-0 right-[8%] w-[45%] -skew-x-12 bg-white/5" />
      <div className="pointer-events-none absolute inset-y-0 -right-[6%] w-[45%] -skew-x-12 bg-black/10" />

      <div className="container-page relative py-14 md:py-16 text-center">
        <h1 className="font-display text-4xl md:text-5xl font-bold">{title}</h1>

        {breadcrumb.length > 0 && (
          <nav aria-label="Breadcrumb" className="mt-3 text-sm text-white/80">
            {breadcrumb.map((crumb, i) => (
              <span key={i}>
                {crumb.to ? (
                  <Link to={crumb.to} className="hover:text-omega-gold">
                    {crumb.label}
                  </Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
                {i < breadcrumb.length - 1 && <span className="mx-2 opacity-60">/</span>}
              </span>
            ))}
          </nav>
        )}
      </div>
    </section>
  )
}
