import { Link } from 'react-router-dom'
import PageBanner from '../components/PageBanner'
import useNow, { startOfDay, toDate } from '../hooks/useNow'
import { intent } from '../lib/prefetch'
import { downloadIcs } from '../lib/calendar'
import { SITE_URL, eventSlug } from '../seo'
import { achievementWeek as w } from '../data/achievementWeek'

// Achievement Week schedule. All details live in src/data/achievementWeek.js; see the note at the
// top of that file for updating it each year.

export default function AchievementWeek() {
  const now = useNow()
  const today = startOfDay(now)
  const weekStart = toDate(w.startDate).getTime()
  const weekEnd = toDate(w.endDate).getTime()
  const status = today < weekStart ? 'before' : today > weekEnd ? 'after' : 'during'
  const daysAway = Math.round((weekStart - today) / 86400000)
  const themes = [...new Set(w.days.map((d) => d.theme))]
  const eventCount = w.days.reduce((n, d) => n + d.events.length, 0)

  return (
    <div>
      <PageBanner
        breadcrumb={[
          { label: 'Home', to: '/' },
          { label: 'Committees', to: '/committees' },
          { label: 'Achievement Week', to: '/committees/achievement-week' },
          { label: `${w.year} Schedule` },
        ]}
        title={`Achievement Week ${w.year}`}
        subtitle={`${w.dateText}. ${w.intro}`}
      />

      {/* At a glance */}
      <section className="container-page pt-14">
        <div className="grid gap-5 sm:grid-cols-3">
          <Fact label="Dates" value={w.dateText}>
            {status === 'before' && (
              <span className="text-gold-light">{daysAway === 1 ? 'Starts tomorrow' : `Starts in ${daysAway} days`}</span>
            )}
            {status === 'during' && <span className="text-gold-light">Happening now</span>}
            {status === 'after' && <span className="text-ink/60">Thank you for joining us</span>}
          </Fact>
          <Fact label="Events" value={`${eventCount} events, 7 days`}>
            Open to brothers, family and the community.
          </Fact>
          <Fact label="Program focus" value={`${themes.length} areas`}>
            {themes.join(' · ')}
          </Fact>
        </div>

        {/* Jump to a day */}
        <nav aria-label="Days of Achievement Week" className="mt-10 flex flex-wrap gap-2">
          {w.days.map((day) => {
            const d = toDate(day.date)
            const isToday = d.getTime() === today
            return (
              <a
                key={day.date}
                href={`#day-${day.date}`}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  isToday ? 'border-gold bg-gold text-night' : 'border-ink/25 text-ink/85 hover:border-gold-light hover:text-gold-light'
                }`}
              >
                {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </a>
            )
          })}
        </nav>
      </section>

      {/* Day-by-day schedule */}
      <section className="container-page pt-14 pb-6" data-track-section="achievement-week">
        <p className="eyebrow">The schedule</p>
        <h2 className="mt-2 mb-8 font-display text-4xl font-semibold">Day by day</h2>

        <ol className="space-y-6">
          {w.days.map((day) => {
            const d = toDate(day.date)
            const past = d.getTime() < today
            const isToday = d.getTime() === today
            return (
              <li
                key={day.date}
                id={`day-${day.date}`}
                className={`reveal scroll-mt-24 rounded-lg border p-5 sm:p-7 flex flex-col md:flex-row gap-5 md:gap-8 ${
                  isToday ? 'border-gold/70 bg-plum/70' : 'border-ink/12 bg-plum/40'
                } ${past ? 'opacity-75' : ''}`}
              >
                <div className="shrink-0 md:w-44">
                  {isToday && <p className="eyebrow mb-1.5">Today</p>}
                  <p className="text-xs uppercase tracking-[0.15em] text-ink/60">{d.toLocaleDateString('en-US', { weekday: 'long' })}</p>
                  <p className={`mt-1 font-display text-[32px] leading-none ${past ? 'text-ink/60' : 'text-gold'}`}>
                    {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="mt-3 inline-block rounded-full border border-gold/45 px-3 py-1 text-xs font-semibold text-gold-light">
                    {day.theme}
                  </p>
                </div>

                <ul className="flex-1 min-w-0 divide-y divide-ink/12">
                  {day.events.map((e) => (
                    <EventRow key={e.title} event={{ ...e, date: day.date }} past={past} />
                  ))}
                </ul>
              </li>
            )
          })}
        </ol>

        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
          <Link to="/committees/achievement-week" {...intent('/committees/achievement-week')} className="font-semibold text-gold-light hover:text-gold">
            ← Achievement Week Committee
          </Link>
          <Link to="/essay-contest" {...intent('/essay-contest')} className="font-semibold text-gold-light hover:text-gold">
            High School Essay Contest →
          </Link>
        </div>
      </section>
    </div>
  )
}

function EventRow({ event: e, past }) {
  const when = [timeRange(e.time, e.endTime), e.timeNote].filter(Boolean).join(' · ')
  const calendarEvent = {
    ...e,
    description: [e.description, e.poc && `Point of contact: ${e.poc}`, e.note, e.link?.href].filter(Boolean).join('\n'),
    url: `${SITE_URL}/achievement-week#day-${e.date}`,
  }

  return (
    <li id={eventSlug(e)} className="scroll-mt-24 py-5 first:pt-0 last:pb-0">
      <h3 className="font-display text-2xl font-semibold text-ink">{e.title}</h3>
      {e.description && <p className="mt-1 text-ink/80">{e.description}</p>}

      <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-[15px] sm:grid-cols-[auto_1fr]">
        {when && <Detail label="Time">{when}</Detail>}
        {e.location && <Detail label="Where">{e.location}</Detail>}
        {e.poc && <Detail label="Contact">{e.poc}</Detail>}
        {e.goal && <Detail label="Goal">{e.goal} minimum</Detail>}
      </dl>
      {e.note && <p className="mt-2 text-sm italic text-ink/65">{e.note}</p>}

      {!past && (
        <div className="mt-4 flex flex-wrap gap-2">
          {e.link && (
            <a
              href={e.link.href}
              target="_blank"
              rel="noreferrer"
              data-track={`achievement week: ${e.link.label}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-night hover:bg-gold-light"
            >
              {e.link.label} →
            </a>
          )}
          <button
            type="button"
            onClick={() => downloadIcs(calendarEvent)}
            data-track="achievement week: add to calendar"
            className={
              e.link
                ? 'inline-flex items-center gap-1.5 rounded-full border border-ink/30 px-4 py-2 text-sm font-semibold text-ink hover:border-gold-light hover:text-gold-light'
                : 'inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-sm font-semibold text-night hover:bg-gold-light'
            }
          >
            <CalendarIcon /> Add to calendar
          </button>
        </div>
      )}
    </li>
  )
}

function Detail({ label, children }) {
  return (
    <>
      <dt className="text-xs uppercase tracking-[0.15em] text-ink/55 sm:pt-0.5">{label}</dt>
      <dd className="text-ink/85">{children}</dd>
    </>
  )
}

function Fact({ label, value, children }) {
  return (
    <div className="reveal tilt rounded-lg border border-ink/15 bg-plum/40 p-6">
      <p className="eyebrow">{label}</p>
      <p className="mt-3 font-display text-2xl font-semibold leading-tight">{value}</p>
      <p className="mt-2 text-sm text-ink/70">{children}</p>
    </div>
  )
}

function formatTime(t) {
  if (!t) return ''
  const m = /^(\d{2}):(\d{2})/.exec(t)
  if (!m) return t
  const h = +m[1]
  return `${((h + 11) % 12) + 1}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`
}

function timeRange(start, end) {
  if (!start) return ''
  return end ? `${formatTime(start)} – ${formatTime(end)}` : formatTime(start)
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" strokeLinecap="round" />
    </svg>
  )
}
