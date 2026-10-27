import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageBanner from '../../components/PageBanner'
import useCachedQuery from '../../hooks/useCachedQuery'
import { committeeDocsQuery } from '../../lib/queries'
import { committees } from '../../data/placeholders'
import { intent } from '../../lib/prefetch'

// Documents/forms for a committee are expected in a Supabase table called
// "committee_documents" with columns: committee_slug (text), title (text),
// file_url (text, e.g. a Supabase Storage public URL), category (text,
// e.g. "Form" or "Event"). Until that table has rows for a committee, a
// placeholder "no documents yet" message is shown.

export default function CommitteeDetail() {
  const { slug } = useParams()
  const committee = committees.find((c) => c.slug === slug)
  const query = useMemo(() => committeeDocsQuery(slug), [slug])
  const { data: documents, loading } = useCachedQuery(query)

  if (!committee) {
    return (
      <div className="container-page py-24 text-center">
        <p className="text-ink/70">Committee not found.</p>
        <Link to="/committees" className="text-ink underline font-semibold">
          Back to Committees
        </Link>
      </div>
    )
  }

  return (
    <div>
      <PageBanner
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Committees', to: '/committees' }, { label: committee.name }]} title={committee.name} subtitle={committee.description} />

      <section className="container-page py-14">
        {committee.programs?.length > 0 && (
          <div className="mb-14">
            <h2 className="font-display text-3xl font-semibold text-ink mb-4">Programs</h2>
            <ul className="grid gap-5 md:grid-cols-2">
              {committee.programs.map((p) => (
                <li key={p.to}>
                  <Link
                    to={p.to}
                    {...intent(p.to)}
                    data-track={`committee program: ${p.title}`}
                    className="reveal tilt group flex h-full flex-col rounded-lg border border-gold/45 bg-plum/50 p-6 transition-colors hover:border-gold hover:bg-plum/70"
                  >
                    <span className="eyebrow">{p.eyebrow}</span>
                    <span className="mt-3 font-display text-2xl font-semibold text-ink">{p.title}</span>
                    <span className="mt-2 flex-1 leading-relaxed text-ink/75">{p.text}</span>
                    <span className="mt-5 font-semibold text-gold-light">Learn more &rarr;</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <h2 className="font-display text-3xl font-semibold text-ink mb-4">
          Forms, Applications &amp; Posts
        </h2>

        {!loading && documents.length === 0 && (
          <p className="text-ink/70 italic">
            No documents posted yet. Committee members can add forms and applications here by
            uploading files to Supabase Storage and adding a row to the "committee_documents" table
            (or via an admin form in the Brothers Only dashboard).
          </p>
        )}

        <ul className="space-y-3">
          {documents.map((d) => (
            <li key={d.title} className="reveal p-4 rounded-lg border border-ink/10 bg-plum/60 flex justify-between items-center">
              <div>
                <p className="text-xs uppercase text-gold font-semibold">{d.category}</p>
                <p className="font-semibold">{d.title}</p>
              </div>
              <a href={d.file_url} target="_blank" rel="noreferrer" data-track={`committee doc: ${d.title}`} className="text-ink font-semibold underline">
                Open
              </a>
            </li>
          ))}
        </ul>

        <Link to="/committees" className="inline-block mt-8 text-ink font-semibold underline">
          &larr; Back to all committees
        </Link>
      </section>
    </div>
  )
}
