import { useDeferredValue, useMemo, useState } from 'react'
import PageBanner from '../components/PageBanner'
import EventCard from '../components/EventCard'
import Seo from '../components/Seo'
import useCachedQuery from '../hooks/useCachedQuery'
import useNow, { startOfDay, toDate } from '../hooks/useNow'
import { eventsQuery } from '../lib/queries'

// Events come from the "events" table the member app (app.etaomicron.org) uses. This public page
// shows only events marked on_website = true (a Supabase policy lets visitors read just those).
// Mark events from the member app's data, or ask Jarvis in the Command Center.
//
// The list is baked into the page at build time, cached on the visitor's device, and refreshed in
// the background (src/lib/cache.js). If Supabase can't be reached and nothing is cached, it falls
// back to the placeholder list in src/data/placeholders.js.

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
  { id: 'all', label: 'All' },
]

export default function Events() {
  const { data: events, source, loading } = useCachedQuery(eventsQuery)
  const now = useNow()
  const [tab, setTab] = useState('upcoming')
  const [search, setSearch] = useState('')
  const query = useDeferredValue(search.trim().toLowerCase())

  const { upcoming, past } = useMemo(() => {
    const today = startOfDay(now)
    const up = []
    const done = []
    for (const e of events) (toDate(e.date).getTime() >= today ? up : done).push(e)
    done.reverse() // most recent first
    return { upcoming: up, past: done }
  }, [events, now])

  const list = tab === 'upcoming' ? upcoming : tab === 'past' ? past : [...upcoming, ...past]
  const filtered = query
    ? list.filter((e) => [e.title, e.location, e.description].filter(Boolean).join(' ').toLowerCase().includes(query))
    : list
  const next = upcoming[0]
  const daysAway = next ? Math.round((toDate(next.date).getTime() - startOfDay(now)) / 86400000) : null
  const counts = { upcoming: upcoming.length, past: past.length, all: events.length }

  return (
    <div>
      <Seo path="/events" data={{ events: upcoming }} meta={false} />
      <PageBanner
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Events' }]}
        title="Events"
        subtitle="Everything happening with the chapter this year."
      />

      <section className="container-page py-14" data-track-section="events">
        {source === 'fallback' && !loading && (
          <p className="text-sm text-ink/60 mb-6 italic">
            Showing placeholder events. Connect a Supabase "events" table to manage these live.
          </p>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div role="tablist" aria-label="Filter events" className="inline-flex rounded-lg bg-plum/60 p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                data-track={`events tab: ${t.id}`}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  tab === t.id ? 'bg-gold text-night' : 'text-ink/70 hover:text-ink'
                }`}
              >
                {t.label} <span className="text-xs opacity-60">{counts[t.id]}</span>
              </button>
            ))}
          </div>

          <label className="relative block sm:w-64">
            <span className="sr-only">Search events</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events"
              className="w-full border border-ink/25 bg-night rounded-md text-ink placeholder:text-ink/45 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/60" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
          </label>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 rounded-lg border border-dashed border-ink/25 bg-plum/60">
            <p className="text-ink/75">
              {query
                ? `No events match "${search}".`
                : tab === 'upcoming'
                  ? 'No upcoming events are posted yet. Check back soon.'
                  : 'No events to show.'}
            </p>
            {tab === 'upcoming' && past.length > 0 && !query && (
              <button type="button" onClick={() => setTab('past')} className="mt-3 text-ink font-semibold underline">
                See past events
              </button>
            )}
          </div>
        )}

        <div className="space-y-4">
          {filtered.map((e) => {
            const isPast = toDate(e.date).getTime() < startOfDay(now)
            const isNext = e === next && !query
            return (
              <EventCard key={e.title + e.date} event={e} past={isPast} highlight={isNext} daysAway={isNext ? daysAway : null} />
            )
          })}
        </div>
      </section>
    </div>
  )
}
