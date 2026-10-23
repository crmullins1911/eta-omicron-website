import { useEffect, useState } from 'react'
import { seedTime } from '../lib/cache'
import { isHydrating } from '../lib/hydration'

/**
 * The current time, safe for prerendered pages: while hydrating it returns the moment the page was
 * built (so "upcoming vs past" matches the HTML exactly), then switches to the real clock.
 */
export default function useNow() {
  const [now, setNow] = useState(() =>
    isHydrating() && seedTime() ? seedTime() : typeof window === 'undefined' ? seedTime() ?? Date.now() : Date.now()
  )
  useEffect(() => {
    setNow(Date.now())
  }, [])
  return now
}

/** "2026-11-15" -> local calendar Date (not midnight UTC, which is the previous day in the US). */
export function toDate(dateStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr || ''))
  return m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(dateStr)
}

/** Start of the given day, local time. */
export function startOfDay(ts) {
  const d = new Date(ts)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
