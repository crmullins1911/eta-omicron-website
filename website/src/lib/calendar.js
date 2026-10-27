import { SITE_URL, eventSlug } from '../seo'

/** Build an .ics file for one event and download it (works with Apple, Google and Outlook calendars). */
export function downloadIcs(e) {
  const pad = (n) => String(n).padStart(2, '0')
  const [y, m, d] = String(e.date).split('-').map(Number)
  const timed = e.time && /^\d{2}:\d{2}/.test(e.time)
  let dtStart, dtEnd
  if (timed) {
    const [hh, mm] = e.time.split(':').map(Number)
    const start = new Date(y, m - 1, d, hh, mm)
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000) // assume 2 hours
    const fmt = (t) => `${t.getFullYear()}${pad(t.getMonth() + 1)}${pad(t.getDate())}T${pad(t.getHours())}${pad(t.getMinutes())}00`
    dtStart = `DTSTART:${fmt(start)}`
    dtEnd = `DTEND:${fmt(end)}`
  } else {
    const next = new Date(y, m - 1, d + 1)
    dtStart = `DTSTART;VALUE=DATE:${y}${pad(m)}${pad(d)}`
    dtEnd = `DTEND;VALUE=DATE:${next.getFullYear()}${pad(next.getMonth() + 1)}${pad(next.getDate())}`
  }
  const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1')
  const now = new Date()
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Eta Omicron Chapter//Website//EN',
    'BEGIN:VEVENT',
    `UID:${eventSlug(e)}@etaomicron.org`,
    `DTSTAMP:${stamp}`,
    dtStart,
    dtEnd,
    `SUMMARY:${esc(e.title)}`,
    e.location ? `LOCATION:${esc(e.location)}` : null,
    e.description ? `DESCRIPTION:${esc(e.description)}` : null,
    `URL:${SITE_URL}/events#${eventSlug(e)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n')

  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `${eventSlug(e)}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Native share sheet on phones; copies the link elsewhere. Returns 'shared' | 'copied' | null. */
export async function shareEvent(e) {
  const url = `${SITE_URL}/events#${eventSlug(e)}`
  try {
    if (navigator.share) {
      await navigator.share({ title: e.title, text: `${e.title}, Eta Omicron Chapter`, url })
      return 'shared'
    }
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return null
  }
}
