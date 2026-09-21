import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import { supabase } from '../lib/supabaseClient'
import { events as placeholderEvents } from '../data/placeholders'

// This page tries to load events from a Supabase table called "events"
// with columns: title (text), event_date (date), location (text),
// description (text). If that table doesn't exist yet, or the query
// fails, it falls back to the placeholder list in src/data/placeholders.js
// so the page always renders something.
//
// To make this "addable" without touching code, create the table in
// Supabase and give trusted committee members insert access via a
// Supabase Row Level Security policy (or manage it from the Brothers Only
// dashboard once you build an admin form there).

export default function Events() {
  const [events, setEvents] = useState(placeholderEvents)
  const [usingFallback, setUsingFallback] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadEvents() {
      const { data, error } = await supabase
        .from('events')
        .select('title, event_date, location, description')
        .order('event_date', { ascending: true })

      if (!active) return

      if (error || !data || data.length === 0) {
        setUsingFallback(true)
        setEvents(placeholderEvents)
      } else {
        setUsingFallback(false)
        setEvents(
          data.map((e) => ({
            title: e.title,
            date: e.event_date,
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
      <PageHeader title="Events" subtitle="Everything happening with the chapter this year." />

      <section className="container-page py-14">
        {usingFallback && !loading && (
          <p className="text-sm text-gray-400 mb-6 italic">
            Showing placeholder events. Connect a Supabase "events" table to manage these live.
          </p>
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
                <p className="text-sm text-gray-500">{e.location}</p>
                <p className="text-gray-600 mt-1">{e.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

function formatMonth(dateStr) {
  const d = new Date(dateStr)
  return isNaN(d) ? '' : d.toLocaleString('en-US', { month: 'short' })
}

function formatDay(dateStr) {
  const d = new Date(dateStr)
  return isNaN(d) ? '' : d.getDate()
}
