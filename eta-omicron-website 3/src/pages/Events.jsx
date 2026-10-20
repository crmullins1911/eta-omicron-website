import { useEffect, useState } from 'react'
import PageBanner from '../components/PageBanner'
import { supabase } from '../lib/supabaseClient'
import { events as placeholderEvents } from '../data/placeholders'

// Events come from the "events" table the member app (app.etaomicron.org) uses. The member app
// shows every event to signed-in brothers; this public page shows only the events marked
// on_website = true (a Supabase policy lets visitors read just those). Mark events from the
// member app's data, or ask Jarvis in the Command Center ("put the banquet on the website").
//
// If Supabase can't be reached, the page falls back to the placeholder list in
// src/data/placeholders.js so it always renders something.

export default function Events() {
  const [events, setEvents] = useState(placeholderEvents)
  const [usingFallback, setUsingFallback] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadEvents() {
      const { data, error } = await supabase
        .from('events')
        .select('title, event_date, event_time, location, description')
        .eq('on_website', true)
        .order('event_date', { ascending: true })

      if (!active) return

      if (error || !data) {
        setUsingFallback(true)
        setEvents(placeholderEvents)
      } else {
        setUsingFallback(false)
        setEvents(
          data.map((e) => ({
            title: e.title,
            date: e.event_date,
            time: e.event_time,
            location: e.location,
            description: e.description,
          }))
        )
      }
      setLoading(false)
    }

    loadEvents()
    return () => {
      active = false
    }
  }, [])

  return (
    <div>
      <PageBanner
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Events' }]} title="Events" subtitle="Everything happening with the chapter this year." />

      <section className="container-page py-14">
        {usingFallback && !loading && (
          <p className="text-sm text-gray-400 mb-6 italic">
            Showing placeholder events. Connect a Supabase "events" table to manage these live.
          </p>
        )}

        {!usingFallback && !loading && events.length === 0 && (
          <p className="text-gray-600">No events are posted yet. Check back soon.</p>
        )}

        <div className="space-y-4">
          {events.map((e) => (
            <article
              key={e.title + e.date}
              className="p-5 rounded-lg border border-gray-200 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="shrink-0 w-24 text-center">
                <div className="rounded-md bg-omega-purple text-white py-2">
                  <p className="text-xs uppercase">{formatMonth(e.date)}</p>
                  <p className="text-xl font-bold">{formatDay(e.date)}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-omega-purple">{e.title}</h3>
                <p className="text-sm text-gray-500">{[e.time, e.location].filter(Boolean).join(', ')}</p>
                {e.description && <p className="text-gray-600 mt-1">{e.description}</p>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

// A date-only string like "2026-11-15" is read by new Date() as midnight UTC, which is still the
// day before in the United States. Read it as a local calendar date instead.
function toDate(dateStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr || ''))
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(dateStr)
}

function formatMonth(dateStr) {
  const d = toDate(dateStr)
  return isNaN(d) ? '' : d.toLocaleString('en-US', { month: 'short' })
}

function formatDay(dateStr) {
  const d = toDate(dateStr)
  return isNaN(d) ? '' : d.getDate()
}
