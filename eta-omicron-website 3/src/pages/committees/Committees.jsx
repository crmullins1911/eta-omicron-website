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

      <section className="container-page py-14 grid gap-6 sm:grid-cols-2">
        {committees.map((c) => (
          <Link
            key={c.slug}
            to={`/committees/${c.slug}`}
            {...intent(`/committees/${c.slug}`)}
            className="reveal p-6 rounded-lg border border-ink/10 bg-plum/60 hover:border-gold transition"
          >
            <h3 className="font-display text-2xl font-semibold text-ink">{c.name}</h3>
            <p className="text-ink/75 mt-2">{c.description}</p>
            <span className="inline-block mt-4 text-sm font-semibold text-ink underline">
              View committee page &rarr;
            </span>
          </Link>
        ))}
      </section>
    </div>
  )
}
