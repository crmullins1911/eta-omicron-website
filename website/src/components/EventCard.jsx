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
      className={`reveal tilt scroll-mt-24 p-5 sm:p-6 rounded-lg border flex flex-col sm:flex-row gap-4 sm:gap-6 ${
        highlight ? 'border-gold/70 bg-plum/70' : 'border-ink/12 bg-plum/40'
      } ${past ? 'opacity-75' : ''}`}
    >
      <div className="shrink-0 sm:w-24">
        <p className={`font-display text-[26px] leading-none ${past ? 'text-ink/60' : 'text-gold'}`}>
          {valid ? d.toLocaleString('en-US', { month: 'short', day: 'numeric' }) : ''}
        </p>
        <p className="mt-1.5 text-xs uppercase tracking-[0.15em] text-ink/60">
          {valid ? d.toLocaleString('en-US', { weekday: 'long' }) : ''}
        </p>
      </div>

      <div className="flex-1 min-w-0">
        {highlight && (
          <p className="eyebrow mb-1.5">
            Next up{daysAway != null && daysAway >= 0 && ` · ${daysAway === 0 ? 'today' : daysAway === 1 ? 'tomorrow' : `in ${daysAway} days`}`}
          </p>
        )}
        <h3 className="font-display text-2xl font-semibold text-ink">{e.title}</h3>
        <p className="text-sm text-ink/70">{[formatTime(e.time), e.location].filter(Boolean).join(' · ')}</p>
        {e.description && <p className="text-ink/75 mt-1">{e.description}</p>}

        {!past && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => downloadIcs(e)}
              data-track="event: add to calendar"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-gold text-night hover:bg-gold-light"
            >
              <CalendarIcon /> Add to calendar
            </button>
            <button
              type="button"
              onClick={onShare}
              data-track="event: share"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border border-ink/30 text-ink hover:border-gold-light hover:text-gold-light"
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
