import PageBanner from '../components/PageBanner'
import { history } from '../data/placeholders'
import useCachedQuery from '../hooks/useCachedQuery'
import useSiteContent, { paragraphs } from '../hooks/useSiteContent'
import { officersQuery } from '../lib/queries'

// History comes from site_content (key "history") and the Executive Committee from site_officers,
// both edited in Supabase. Until they're filled in, the built-in placeholders show.

export default function About() {
  const content = useSiteContent()
  const { data: officers } = useCachedQuery(officersQuery)
  const historyParagraphs = paragraphs(content.history || history)
  return (
    <div>
      <PageBanner
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'About Us' }]}
        title="About Us"
        subtitle="Our history, our leadership, and the principles that guide us."
      />

      <section id="history" className="container-page py-14 scroll-mt-24">
        <h2 className="font-display text-3xl font-semibold text-ink mb-4">Chapter History</h2>
        <div className="max-w-3xl space-y-4">
          {historyParagraphs.map((p, i) => (
            <p key={i} className="text-ink/85 leading-relaxed whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>
      </section>

      <section id="leadership" className="container-page pb-16 scroll-mt-24">
        <h2 className="font-display text-3xl font-semibold text-ink mb-6">Executive Committee</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {officers.map((o) => (
            <div key={o.role} className="reveal tilt rounded-lg border border-ink/10 bg-plum/60 p-5">
              {o.photo ? (
                <img
                  src={o.photo}
                  alt={o.name}
                  loading="lazy"
                  decoding="async"
                  className="h-16 w-16 rounded-full border border-gold/60 object-cover mb-4"
                />
              ) : (
                <div className="h-16 w-16 rounded-full border border-gold/60 flex items-center justify-center font-display text-gold text-2xl mb-4">
                  {o.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
              )}
              <p className="text-xs uppercase tracking-wide text-gold font-semibold">{o.role}</p>
              <p className="font-semibold text-lg mt-1">{o.name}</p>
              {o.bio && <p className="text-sm text-ink/70 mt-2 whitespace-pre-line">{o.bio}</p>}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
