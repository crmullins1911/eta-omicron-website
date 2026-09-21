import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import { supabase } from '../lib/supabaseClient'
import { mediaItems as placeholderMedia } from '../data/placeholders'

// Photos/videos are expected in a Supabase Storage bucket called "media"
// with metadata tracked in a "media_items" table (columns: title, type
// ["image"|"video"], url). Falls back to placeholder tiles otherwise.

export default function Media() {
  const [items, setItems] = useState(placeholderMedia)
  const [usingFallback, setUsingFallback] = useState(true)

  useEffect(() => {
    let active = true

    async function loadMedia() {
      const { data, error } = await supabase
        .from('media_items')
        .select('title, type, url')
        .order('created_at', { ascending: false })

      if (!active) return
      if (error || !data || data.length === 0) {
        setUsingFallback(true)
        setItems(placeholderMedia)
      } else {
        setUsingFallback(false)
        setItems(data)
      }
    }

    loadMedia()
    return () => {
      active = false
    }
  }, [])

  return (
    <div>
      <PageHeader title="Media" subtitle="Photos and videos from our chapter events." />

      <section className="container-page py-14">
        {usingFallback && (
          <p className="text-sm text-gray-400 mb-6 italic">
            Showing placeholder gallery items. Connect Supabase Storage + a "media_items" table to
            manage this live.
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <div key={m.title} className="rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
              <div className="aspect-video bg-omega-purple/10 flex items-center justify-center text-omega-purple/50 text-sm">
                {m.url ? (
                  m.type === 'video' ? (
                    <video src={m.url} controls className="w-full h-full object-cover" />
                  ) : (
                    <img src={m.url} alt={m.title} className="w-full h-full object-cover" />
                  )
                ) : (
                  <span>{m.type === 'video' ? 'Video placeholder' : 'Photo placeholder'}</span>
                )}
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm">{m.title}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
