import { Link } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import { committees } from '../../data/placeholders'

export default function Committees() {
  return (
    <div>
      <PageHeader
        title="Committees"
        subtitle="Each committee manages its own events, forms, and applications."
      />

      <section className="container-page py-14 grid gap-6 sm:grid-cols-2">
        {committees.map((c) => (
          <Link
            key={c.slug}
            to={`/committees/${c.slug}`}
            className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-omega-gold transition"
          >
            <h3 className="font-display text-xl font-bold text-omega-purple">{c.name}</h3>
            <p className="text-gray-600 mt-2">{c.description}</p>
            <span className="inline-block mt-4 text-sm font-semibold text-omega-purple underline">
              View committee page &rarr;
            </span>
          </Link>
        ))}
      </section>
    </div>
  )
}
