import { useEffect, useState } from 'react'
import PageBanner from '../components/PageBanner'
import { SUPABASE_URL, supabaseConfigured, supabaseHeaders } from '../lib/rest'
import { settingFixes } from '../lib/supabaseConfig'
import { clearCache, getSeed } from '../lib/cache'

// Hidden diagnostics page (/status): checks every Supabase request the website makes, live, and
// explains any failure in plain English. Not linked anywhere, not in the sitemap, not indexed.
// Shows no secrets: only the Supabase project address and whether a key is present.

const CHECKS = [
  {
    id: 'events',
    label: 'Events table',
    what: 'Events page and home page',
    path: 'events?select=title,event_date,event_time,location,description&order=event_date.asc',
  },
  {
    id: 'events-website',
    label: 'Events marked for the website',
    what: 'Events page and home page',
    path: 'events?select=title,event_date&on_website=eq.true&order=event_date.asc',
  },
  { id: 'media', label: 'Media items', what: 'Media page', path: 'media_items?select=title,type,url&order=created_at.desc' },
  {
    id: 'docs',
    label: 'Committee documents',
    what: 'Committee pages',
    path: 'committee_documents?select=committee_slug,title,file_url&limit=50',
  },
  {
    id: 'posts',
    label: 'Feed posts shared to the website',
    what: 'News page',
    path: 'posts?select=id,caption,created_at&on_website=eq.true&limit=10',
  },
]

export default function Status() {
  const [results, setResults] = useState({})
  const [running, setRunning] = useState(false)
  const [cleared, setCleared] = useState(false)
  const projectRef = SUPABASE_URL ? safeHost(SUPABASE_URL) : null
  const [seed, setSeed] = useState(null) // filled in after load, so the prebuilt page matches

  const run = async () => {
    setRunning(true)
    const out = {}
    await Promise.all(
      CHECKS.map(async (c) => {
        out[c.id] = await check(c)
      })
    )
    setResults(out)
    setRunning(false)
  }

  useEffect(() => {
    run()
    // The data this deploy was built with (from this page, or else from the home page).
    const own = getSeed()
    if (own) setSeed(own)
    else {
      fetch('/', { cache: 'no-store' })
        .then((r) => r.text())
        .then((html) => {
          const m = /window\.__EO_SEED__=(\{.*?\})<\/script>/s.exec(html)
          if (m) setSeed(JSON.parse(m[1]))
        })
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clearDevice = async () => {
    clearCache()
    try {
      const regs = (await navigator.serviceWorker?.getRegistrations?.()) || []
      await Promise.all(regs.map((r) => r.unregister()))
      const keys = (await caches?.keys?.()) || []
      await Promise.all(keys.filter((k) => k.startsWith('eo-')).map((k) => caches.delete(k)))
    } catch {
      /* ignore */
    }
    setCleared(true)
  }

  const report = buildReport({ projectRef, seed, results })

  return (
    <div>
      <PageBanner title="Website Status" subtitle="Live check of the website's connection to Supabase." />

      <section className="container-page py-12 space-y-8 max-w-4xl">
        <div className="rounded-lg border border-ink/15 bg-plum/40 p-6 space-y-2">
          <p className="eyebrow">Connection settings (from Vercel)</p>
          <Row label="Supabase project" value={projectRef || 'NOT SET'} bad={!projectRef} />
          <Row label="Public (anon) key" value={supabaseConfigured ? 'present' : 'MISSING'} bad={!supabaseConfigured} />
          <Row
            label="Data baked in at last deploy"
            value={
              seed?.builtAt
                ? `${new Date(seed.builtAt).toLocaleString('en-US')} · ${Object.keys(seed.data || {}).length} live data sets`
                : 'none'
            }
          />
          {settingFixes.length > 0 && (
            <div className="mt-3 rounded-md border border-amber-400/50 bg-amber-400/10 p-3 text-sm">
              <p className="font-semibold text-amber-200">Repaired automatically (fix these in Vercel when convenient):</p>
              <ul className="mt-1 list-disc pl-5 text-ink/85">
                {settingFixes.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          {projectRef && (
            <p className="text-sm text-ink/70 pt-2">
              Compare the project above with the one app.etaomicron.org uses (Supabase dashboard → Project Settings →
              General → Reference ID). They must match.
            </p>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="eyebrow">Live checks</p>
            <button
              type="button"
              onClick={run}
              disabled={running}
              className="rounded-full border border-ink/30 px-4 py-2 text-sm font-semibold hover:border-gold-light hover:text-gold-light disabled:opacity-50"
            >
              {running ? 'Checking…' : 'Run again'}
            </button>
          </div>
          <ul className="space-y-3">
            {CHECKS.map((c) => {
              const r = results[c.id]
              return (
                <li key={c.id} className={`rounded-lg border p-5 ${!r ? 'border-ink/15' : !r.ok ? 'border-red-400/60' : r.empty ? 'border-amber-400/60' : 'border-green-500/50'}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold">
                      <span aria-hidden="true" className={!r ? 'text-ink/50' : !r.ok ? 'text-red-300' : r.empty ? 'text-amber-300' : 'text-green-400'}>
                        {!r ? '…' : !r.ok ? '✕' : r.empty ? '!' : '✓'}
                      </span>{' '}
                      {c.label} <span className="font-normal text-ink/60">({c.what})</span>
                    </p>
                    {r && <p className="text-sm text-ink/70">{r.summary}</p>}
                  </div>
                  {r?.advice && <p className="mt-2 text-ink/85">{r.advice}</p>}
                  {r?.sample && <p className="mt-2 text-sm text-ink/60">Example: {r.sample}</p>}
                </li>
              )
            })}
          </ul>
        </div>

        <div className="rounded-lg border border-ink/15 p-6 space-y-3">
          <p className="eyebrow">Send this to whoever is helping you</p>
          <textarea readOnly value={report} rows={10} className="w-full rounded-md border border-ink/25 bg-night p-3 font-mono text-xs text-ink" />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(report)}
              className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-night hover:bg-gold-light"
            >
              Copy report
            </button>
            <button
              type="button"
              onClick={clearDevice}
              className="rounded-full border border-ink/30 px-4 py-2 text-sm font-semibold hover:border-gold-light hover:text-gold-light"
            >
              {cleared ? 'Cleared — reload any page' : 'Clear saved site data on this device'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

function Row({ label, value, bad }) {
  return (
    <p className="flex flex-wrap justify-between gap-2">
      <span className="text-ink/70">{label}</span>
      <span className={`font-mono text-sm ${bad ? 'text-red-300' : 'text-ink'}`}>{value}</span>
    </p>
  )
}

async function check(c) {
  if (!supabaseConfigured) {
    return { ok: false, summary: 'not checked', advice: 'The Supabase settings are missing from this deploy. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel and redeploy.' }
  }
  let res
  try {
    res = await fetch(`${SUPABASE_URL}/rest/v1/${c.path}`, { headers: supabaseHeaders({ Accept: 'application/json' }), cache: 'no-store' })
  } catch (err) {
    return {
      ok: false,
      summary: 'could not connect',
      detail: String(err?.message || err).slice(0, 120),
      advice: `The browser could not reach Supabase at all (${err.message}). The project address in Vercel is probably wrong, or the project is paused (free projects pause after a week without use; restore it from the Supabase dashboard).`,
    }
  }
  let body = null
  try {
    body = await res.json()
  } catch {
    /* not JSON */
  }
  if (res.ok) {
    const n = Array.isArray(body) ? body.length : 0
    const first = Array.isArray(body) && body[0] ? body[0].title || body[0].caption || body[0].event_date || '' : ''
    return {
      ok: true,
      empty: n === 0,
      summary: `${n} row${n === 1 ? '' : 's'} visible to the public`,
      advice: n > 0 ? null : emptyAdvice(c.id),
      sample: first ? String(first).slice(0, 80) : null,
    }
  }
  return { ok: false, summary: `error ${res.status}${body?.code ? ` · ${body.code}` : ''}`, advice: errorAdvice(c, res.status, body) }
}

function emptyAdvice(id) {
  switch (id) {
    case 'events':
      return 'Supabase answered, but visitors can see no events. Either no events are marked on_website = true (visitors may only read those), or the table is empty. Turn on "Show on public website" for an event, or run: update public.events set on_website = true;'
    case 'events-website':
      return 'No event is marked for the website. In the member app tap Edit → Show on public website, or in Supabase set on_website to TRUE.'
    case 'media':
      return 'The media_items table is empty, or visitors are not allowed to read it. Add a row in Table Editor → media_items, and make sure the one-time setup script was run (it adds the "Public can read media" rule).'
    case 'docs':
      return 'No committee documents posted yet (or visitors are not allowed to read them; run the one-time setup script).'
    case 'posts':
      return 'No feed posts shared yet. In the app, tap "Share to website" under a post.'
    default:
      return null
  }
}

function errorAdvice(c, status, body) {
  const code = body?.code || ''
  const msg = body?.message || body?.error || ''
  if (status === 401 || /JWT|apikey|Invalid API key/i.test(msg)) {
    return 'Supabase rejected the website\'s key. VITE_SUPABASE_ANON_KEY in Vercel is wrong or from a different project. Copy the "anon public" key from Supabase → Project Settings → API, update it in Vercel, and redeploy.'
  }
  if (code === 'PGRST205' || code === '42P01' || /does not exist|Could not find the table/i.test(msg)) {
    return `The table this needs does not exist in this Supabase project. Run the one-time setup script from the how-to guide. (Supabase said: ${msg})`
  }
  if (code === '42703' || /column .* does not exist/i.test(msg)) {
    return `A column the website needs is missing: ${msg}. Run: alter table public.events add column if not exists on_website boolean not null default false; alter table public.events add column if not exists description text;`
  }
  if (code === '42501' || status === 403 || /permission denied/i.test(msg)) {
    return `Visitors are not allowed to read this table. Run the one-time setup script (it adds the read rules). (Supabase said: ${msg})`
  }
  return `Supabase returned an error: ${msg || status}.`
}

function safeHost(url) {
  try {
    return new URL(url).host
  } catch {
    return `INVALID: "${url}"`
  }
}

function buildReport({ projectRef, seed, results }) {
  const lines = [
    `Eta Omicron website status — ${new Date().toISOString()}`,
    `Page: ${typeof location !== 'undefined' ? location.host : ''}`,
    `Supabase project: ${projectRef || 'NOT SET'}`,
    `Anon key: ${supabaseConfigured ? 'present' : 'MISSING'}`,
    `Settings repaired: ${settingFixes.length ? settingFixes.join('; ') : 'none'}`,
    `Baked-in data: ${seed?.builtAt ? new Date(seed.builtAt).toISOString() : 'none'} (${Object.keys(seed?.data || {}).join(', ') || 'no live sets'})`,
    '',
  ]
  for (const c of CHECKS) {
    const r = results[c.id]
    lines.push(`${!r ? '...  ' : !r.ok ? 'FAIL ' : r.empty ? 'EMPTY' : 'OK   '}  ${c.label}: ${r?.summary || 'pending'}${r?.detail ? ` (${r.detail})` : ''}`)
  }
  return lines.join('\n')
}
