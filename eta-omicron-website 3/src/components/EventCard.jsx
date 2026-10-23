import { useState } from 'react'
import { toDate } from '../hooks/useNow'
import { eventSlug } from '../seo'
import { downloadIcs, shareEvent } from '../lib/calendar'

export default function EventCard({ event: e, past = false, highlight = false, daysAway = null }) {
  const [shareState, setShareState] = useState(null)
  const d = toDate(e.date)
  const valid = !isNaN(d)

  async function onShare() {
    const result = await shareEvent(e)
    if (result === 'copied') {
      setShareState('Link copied')
      setTimeout(() => setShareState(null), 2000)
    }
  }

  return (
    <article
      id={eventSlug(e)}
      className={`reveal scroll-mt-24 p-5 rounded-lg border bg-white shadow-sm flex flex-col sm:flex-row gap-4 ${
        highlight ? 'border-omega-gold ring-1 ring-omega-gold/40' : 'border-gray-200'
      } ${past ? 'opacity-80' : ''}`}
    >
      <div className="shrink-0 w-24 text-center">
        <div className={`rounded-md py-2 ${past ? 'bg-gray-500' : 'bg-omega-purple'} text-white`}>
          <p className="text-xs uppercase">{valid ? d.toLocaleString('en-US', { month: 'short' }) : ''}</p>
          <p className="text-xl font-bold">{valid ? d.getDate() : ''}</p>
          <p className="text-[10px] uppercase opacity-75">{valid ? d.toLocaleString('en-US', { weekday: 'short' }) : ''}</p>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {highlight && (
          <p className="text-xs font-semibold uppercase tracking-wide text-omega-gold mb-1">
            Next up{daysAway != null && daysAway >= 0 && ` · ${daysAway === 0 ? 'today' : daysAway === 1 ? 'tomorrow' : `in ${daysAway} days`}`}
          </p>
        )}
        <h3 className="font-semibold text-lg text-omega-purple">{e.title}</h3>
        <p className="text-sm text-gray-500">{[formatTime(e.time), e.location].filter(Boolean).join(' · ')}</p>
        {e.description && <p className="text-gray-600 mt-1">{e.description}</p>}

        {!past && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadIcs(e)}
              data-track="event: add to calendar"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold bg-omega-purple text-white hover:bg-omega-purple-dark"
            >
              <CalendarIcon /> Add to calendar
            </button>
            <button
              type="button"
              onClick={onShare}
              data-track="event: share"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <ShareIcon /> {shareState || 'Share'}
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

function formatTime(t) {
  if (!t) return ''
  const m = /^(\d{2}):(\d{2})/.exec(t)
  if (!m) return t
  const h = +m[1]
  return `${((h + 11) % 12) + 1}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" strokeLinecap="round" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
