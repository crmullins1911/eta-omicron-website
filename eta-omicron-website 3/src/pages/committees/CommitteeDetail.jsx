import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../../components/PageHeader'
import { supabase } from '../../lib/supabaseClient'
import { committees } from '../../data/placeholders'

// Documents/forms for a committee are expected in a Supabase table called
// "committee_documents" with columns: committee_slug (text), title (text),
// file_url (text, e.g. a Supabase Storage public URL), category (text,
// e.g. "Form" or "Event"). Until that table has rows for a committee, a
// placeholder "no documents yet" message is shown.

export default function CommitteeDetail() {
  const { slug } = useParams()
  const committee = committees.find((c) => c.slug === slug)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadDocs() {
      const { data, error } = await supabase
        .from('committee_documents')
        .select('title, file_url, category')
        .eq('committee_slug', slug)

      if (!active) return
      setDocuments(error || !data ? [] : data)
      setLoading(false)
    }

    loadDocs()
    return () => {
      active = false
    }
  }, [slug])

  if (!committee) {
    return (
      <div className="container-page py-24 text-center">
        <p className="text-gray-500">Committee not found.</p>
        <Link to="/committees" className="text-omega-purple underline font-semibold">
          Back to Committees
        </Link>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title={committee.name} subtitle={committee.description} />

      <section className="container-page py-14">
        <h2 className="font-display text-2xl font-bold text-omega-purple mb-4">
          Forms, Applications &amp; Posts
        </h2>

        {!loading && documents.length === 0 && (
          <p className="text-gray-500 italic">
            No documents posted yet. Committee members can add forms and applications here by
            uploading files to Supabase Storage and adding a row to the "committee_documents" table
            (or via an admin form in the Brothers Only dashboard).
          </p>
        )}

        <ul className="space-y-3">
          {documents.map((d) => (
            <li key={d.title} className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm flex justify-between items-center">
              <div>
                <p className="text-xs uppercase text-omega-gold font-semibold">{d.category}</p>
                <p className="font-semibold">{d.title}</p>
              </div>
              <a href={d.file_url} target="_blank" rel="noreferrer" className="text-omega-purple font-semibold underline">
                Open
              </a>
            </li>
          ))}
        </ul>

        <Link to="/committees" className="inline-block mt-8 text-omega-purple font-semibold underline">
          &larr; Back to all committees
        </Link>
      </section>
    </div>
  )
}
