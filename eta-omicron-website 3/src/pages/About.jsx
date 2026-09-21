import PageHeader from '../components/PageHeader'
import { history, officers } from '../data/placeholders'

export default function About() {
  return (
    <div>
      <PageHeader
        title="About Us"
        subtitle="Our history, our leadership, and the principles that guide us."
      />

      <section className="container-page py-14">
        <h2 className="font-display text-2xl font-bold text-omega-purple mb-4">Chapter History</h2>
        <p className="text-gray-700 leading-relaxed max-w-3xl">{history}</p>
      </section>

      <section className="container-page pb-16">
        <h2 className="font-display text-2xl font-bold text-omega-purple mb-6">Officers &amp; Leadership</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {officers.map((o) => (
            <div key={o.role} className="rounded-lg border border-gray-200 bg-white shadow-sm p-5">
              <div className="h-16 w-16 rounded-full bg-omega-purple/10 flex items-center justify-center text-omega-purple font-bold text-xl mb-4">
                {o.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </div>
              <p className="text-xs uppercase tracking-wide text-omega-gold font-semibold">{o.role}</p>
              <p className="font-semibold text-lg mt-1">{o.name}</p>
              <p className="text-sm text-gray-500 mt-2">{o.bio}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
