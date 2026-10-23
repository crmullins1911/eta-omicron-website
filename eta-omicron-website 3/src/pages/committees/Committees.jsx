import { Link } from 'react-router-dom'
import PageBanner from '../../components/PageBanner'
import { committees } from '../../data/placeholders'
import { intent } from '../../lib/prefetch'

export default function Committees() {
  return (
    <div>
      <PageBanner
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Committees' }]}
        title="Committees"
        subtitle="Each committee manages its own events, forms, and applications."
      />

      <section className="container-page py-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {committees.map((c) => (
          <Link
            key={c.slug}
            to={`/committees/${c.slug}`}
            {...intent(`/committees/${c.slug}`)}
            className="reveal group flex flex-col p-6 rounded-lg border border-ink/15 bg-plum/40 hover:border-gold hover:bg-plum/70 transition-colors"
          >
            <h3 className="font-display text-2xl font-semibold text-ink">{c.name}</h3>
            <p className="text-ink/75 mt-2 flex-1 leading-relaxed">{c.description}</p>
            <span className="mt-5 text-sm font-semibold text-gold-light group-hover:text-gold">
              Forms &amp; updates &rarr;
            </span>
          </Link>
        ))}
      </section>
    </div>
  )
}
