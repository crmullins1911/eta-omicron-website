import { useEffect, useState } from 'react'
import { getSupabase } from '../context/AuthContext'

// Brothers Only panel showing what real visitors experience on the public site, from the
// rum_summary() database function (supabase/migrations/20261023_rum_events.sql).

// Google's Core Web Vitals thresholds (good / poor) for the 75th percentile.
const VITALS = [
  { key: 'LCP', label: 'Largest Contentful Paint', hint: 'How fast the main content appears', good: 2500, poor: 4000, unit: 'ms' },
  { key: 'INP', label: 'Interaction to Next Paint', hint: 'How quickly the page responds to taps and clicks', good: 200, poor: 500, unit: 'ms' },
  { key: 'CLS', label: 'Cumulative Layout Shift', hint: 'How much the layout jumps while loading', good: 0.1, poor: 0.25, unit: '' },
  { key: 'FCP', label: 'First Contentful Paint', hint: 'When anything first shows on screen', good: 1800, poor: 3000, unit: 'ms' },
  { key: 'TTFB', label: 'Time to First Byte', hint: 'How fast the server starts responding', good: 800, poor: 1800, unit: 'ms' },
]

const RANGES = [1, 7, 30]

export default function SiteHealth() {
  const [days, setDays] = useState(7)
  const [state, setState] = useState({ status: 'loading' })

  useEffect(() => {
    let active = true
    setState((s) => ({ ...s, status: 'loading' }))
    getSupabase()
      .then((supabase) => supabase.rpc('rum_summary', { window_days: days }))
      .then(({ data, error }) => {
        if (!active) return
        if (error) setState({ status: 'error', error })
        else setState({ status: 'ready', data })
      })
      .catch((error) => active && setState({ status: 'error', error }))
    return () => {
      active = false
    }
  }, [days])

  return (
    <section className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="font-display text-xl font-bold text-omega-purple">Website Health</h3>
          <p className="text-sm text-gray-500">How real visitors experience the public site.</p>
        </div>
        <div className="inline-flex rounded-lg bg-omega-purple/5 p-1" role="group" aria-label="Time range">
          {RANGES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              aria-pressed={days === d}
              className={`px-3 py-1 rounded-md text-sm font-semibold ${days === d ? 'bg-white text-omega-purple shadow-sm' : 'text-omega-purple/70'}`}
            >
              {d === 1 ? '24h' : `${d}d`}
            </button>
          ))}
        </div>
      </div>

      {state.status === 'error' && <SetupNote error={state.error} />}
      {state.status === 'loading' && !state.data && <div className="skeleton h-40" />}
      {state.data && <Summary data={state.data} dim={state.status === 'loading'} />}
    </section>
  )
}

function Summary({ data, dim }) {
  const pct = (x) => (x == null ? '–' : `${Math.round(x * 100)}%`)
  const stats = [
    { label: 'Visits', value: data.sessions ?? 0 },
    { label: 'Page views', value: data.page_views ?? 0 },
    { label: 'Bounce rate', value: pct(data.bounce_rate), note: 'one page, <10 s, no clicks' },
    { label: 'Avg. time engaged', value: data.avg_engaged_seconds != null ? `${data.avg_engaged_seconds}s` : '–' },
  ]

  if (!data.page_views) {
    return <p className="text-gray-500 text-sm">No visits recorded in this period yet. Data appears within a minute of someone visiting the site.</p>
  }

  return (
    <div className={dim ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-md bg-omega-purple/5 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-omega-purple tabular-nums">{s.value}</p>
            {s.note && <p className="text-[11px] text-gray-400">{s.note}</p>}
          </div>
        ))}
      </div>

      <h4 className="font-semibold text-sm text-gray-700 mb-2">Speed (75th percentile of visits)</h4>
      <ul className="divide-y divide-gray-100 mb-6">
        {VITALS.map((v) => {
          const m = data.vitals?.[v.key]
          const rating = m ? (m.p75 <= v.good ? 'good' : m.p75 <= v.poor ? 'ok' : 'poor') : null
          const color = { good: 'bg-green-600', ok: 'bg-amber-500', poor: 'bg-red-600' }[rating] || 'bg-gray-300'
          const label = { good: 'Good', ok: 'Needs work', poor: 'Poor' }[rating] || 'No data'
          return (
            <li key={v.key} className="py-2 flex items-center gap-3">
              <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${color}`} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">
                  {v.key} <span className="font-normal text-gray-500">{v.label}</span>
                </p>
                <p className="text-xs text-gray-400">{v.hint}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums">{m ? formatVital(m.p75, v.unit) : '–'}</p>
                <p className="text-xs text-gray-400">
                  {label}
                  {m && ` · ${m.samples} visits`}
                </p>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="grid gap-6 md:grid-cols-2">
        <Table
          title="Top pages"
          rows={data.top_pages}
          cols={[
            { key: 'path', label: 'Page' },
            { key: 'views', label: 'Views', num: true },
            { key: 'avg_seconds', label: 'Avg. time', num: true, fmt: (x) => (x == null ? '–' : `${x}s`) },
            { key: 'avg_scroll', label: 'Scroll', num: true, fmt: (x) => (x == null ? '–' : `${x}%`) },
          ]}
        />
        <Table
          title="Where visitors come from"
          rows={data.referrers}
          cols={[
            { key: 'referrer', label: 'Source', fmt: (x) => x || 'unknown' },
            { key: 'visits', label: 'Visits', num: true },
          ]}
        />
        <Table
          title="Most clicked"
          rows={data.top_clicks}
          cols={[
            { key: 'name', label: 'Link or button' },
            { key: 'clicks', label: 'Clicks', num: true },
          ]}
        />
        <Table
          title="Errors"
          empty="No errors recorded."
          rows={data.errors}
          cols={[
            { key: 'name', label: 'Message' },
            { key: 'occurrences', label: 'Count', num: true },
          ]}
        />
      </div>
    </div>
  )
}

function Table({ title, rows = [], cols, empty = 'Nothing yet.' }) {
  return (
    <div>
      <h4 className="font-semibold text-sm text-gray-700 mb-2">{title}</h4>
      {!rows?.length ? (
        <p className="text-sm text-gray-400">{empty}</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
              {cols.map((c) => (
                <th key={c.key} className={`py-1 font-medium ${c.num ? 'text-right' : ''}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-gray-100 last:border-0">
                {cols.map((c) => (
                  <td key={c.key} className={`py-1.5 ${c.num ? 'text-right tabular-nums' : 'break-all'}`}>
                    {c.fmt ? c.fmt(r[c.key]) : r[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function formatVital(value, unit) {
  if (unit === 'ms') return value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${Math.round(value)} ms`
  return Number(value).toFixed(3)
}

function SetupNote({ error }) {
  const missing = /rum_summary|function|schema cache|PGRST202|42883/i.test(error?.message || '')
  return (
    <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
      {missing ? (
        <>
          Monitoring isn't set up in the database yet. Run{' '}
          <code className="font-mono">supabase/migrations/20261023_rum_events.sql</code> in the Supabase SQL editor,
          then reload this page.
        </>
      ) : (
        <>Couldn't load website health: {error?.message || 'unknown error'}</>
      )}
    </div>
  )
}
