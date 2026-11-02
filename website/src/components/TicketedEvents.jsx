import { useEffect, useState } from 'react'

// Events with tickets on sale, pulled live from the ticketing app (tickets.etaomicron.org, on the VPS).
// Officers publish events there; they show up here automatically, no rebuild needed.
// Renders nothing until loaded, if nothing is on sale, or if the ticket site can't be reached,
// so the build-time prerender and offline visits are unaffected.

const TICKETS_URL = 'https://tickets.etaomicron.org'

export default function TicketedEvents({ slug, title = 'Tickets on sale' }) {
  const [events, setEvents] = useState([])

  useEffect(() => {
    let alive = true
    fetch(`${TICKETS_URL}/api/events`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => alive && setEvents(slug ? list.filter((e) => e.slug === slug) : list))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [slug])

  if (events.length === 0) return null

  return (
    <div className="mb-10" data-track-section="tickets">
      <p className="eyebrow mb-3">{title}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {events.map((e) => {
          const d = new Date(e.starts_at)
          return (
            <a
              key={e.id}
              href={e.url}
              data-track={`tickets: ${e.slug}`}
              className="group flex gap-4 p-5 rounded-lg border border-gold/60 bg-plum/70 hover:border-gold-light transition-colors"
            >
              <div className="shrink-0 w-24">
                <p className="font-display text-[26px] leading-none text-gold whitespace-nowrap">
                  {d.toLocaleString('en-US', { month: 'short', day: 'numeric' })}
                </p>
                <p className="mt-1.5 text-xs uppercase tracking-[0.15em] text-ink/60">
                  {d.toLocaleString('en-US', { weekday: 'short' })}
                </p>
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-xl font-semibold text-ink">{e.title}</h3>
                <p className="text-sm text-ink/70">
                  {[d.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' }), e.venue_name].filter(Boolean).join(' · ')}
                </p>
                <p className="mt-2 text-sm font-semibold text-gold group-hover:text-gold-light">
                  {e.sold_out ? 'Sold out' : `${priceLabel(e.from_price_cents)} · Get tickets →`}
                </p>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}

function priceLabel(cents) {
  if (cents == null) return 'Brothers only'
  if (cents === 0) return 'Free'
  return `From $${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`
}
