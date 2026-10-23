# Eta Omicron Chapter Website

Public-facing website for the Eta Omicron Chapter of Omega Psi Phi Fraternity, Inc.
Built with React + Vite + Tailwind CSS v4, and designed to share the same Supabase
project as `app.etaomicron.org` so Brothers Only logins work across both sites.

## Pages

- **Home** (`/`) — General chapter info and announcements, plus a preview of upcoming events.
- **About Us** (`/about`) — Chapter history and an officer/leadership grid.
- **Events** (`/events`) — Full event list. Pulls from a Supabase `events` table if present,
  otherwise shows placeholder events from `src/data/placeholders.js`.
- **Committees** (`/committees`, `/committees/:slug`) — One page per committee listing
  forms, applications, and posts. Pulls from a `committee_documents` table if present.
- **Media** (`/media`) — Photo/video gallery. Pulls from a `media_items` table + Supabase
  Storage if present, otherwise shows placeholder tiles.
- **Brothers Only** (`/brothers`, `/brothers/login`) — Auth-gated section using Supabase
  Auth. Sign-in uses the same accounts as `app.etaomicron.org`.

## Performance, caching and monitoring

### Phased rendering
`npm run build` runs three steps: the browser bundle, a server renderer, and `scripts/prerender.mjs`,
which renders every public page to static HTML (`dist/events.html`, etc.) with live Supabase data,
page titles/descriptions, Open Graph tags and JSON-LD structured data baked in. Visitors see full
content before any JavaScript runs, and search engines get complete pages. The build also writes
`sitemap.xml` and `robots.txt`.

In the browser, rendering happens in phases:
1. The static HTML paints immediately.
2. Only the current page's code chunk loads (every page except Home is code-split, `src/routes.js`),
   then React hydrates. Sections below the fold (`<LazyHydrate>`) stay static until they scroll near.
3. When idle, likely next pages are prefetched; hovering or tapping a link prefetches that page.

Public pages read Supabase with plain `fetch` (`src/lib/rest.js`); the supabase-js client
(~55 KB gzipped) only loads in the Brothers Only area.

Data on Vercel builds is as fresh as the last deploy, and the browser refreshes it in the background.
Redeploy (or have Jarvis trigger a deploy hook) after big content changes so search engines see them.

### Persistent caching
- **Data** (`src/lib/cache.js`): events, media and committee documents are stored in localStorage
  with stale-while-revalidate. Returning visitors see the last data instantly, then fresh data loads
  in the background (events: 5 min freshness, media/docs: 15 min). Tabs stay in sync.
- **Files** (`public/sw.js`): a service worker keeps JS/CSS, Supabase photos and visited pages on the
  device, so repeat visits are fast and visited pages open offline. Add `?sw=off` to any URL to remove
  it from that browser while debugging.
- `vercel.json` sets long-lived caching for hashed assets.

### Real-user monitoring
`src/lib/rum.js` records page views, Core Web Vitals (LCP, INP, CLS, FCP, TTFB), engagement (visible
time, scroll depth, interactions), clicks and JavaScript errors into the `rum_events` table. No names,
emails, IPs or form contents; visitors with Global Privacy Control / Do Not Track are skipped.

**One-time setup:** run `supabase/migrations/20261023_rum_events.sql` in the Supabase SQL editor.
Visitors can only insert rows; signed-in brothers see the aggregated **Website Health** panel in
Brothers Only (via `rum_summary()`), and the service role (Command Center) can query everything.
Set `VITE_RUM_SAMPLE_RATE` below 1 if traffic ever gets large.

## Getting started

```bash
npm install
cp .env.example .env   # fill in your Supabase project URL + anon key
npm run dev
```

Use the **same Supabase project** that powers `app.etaomicron.org` (Project Settings > API
in the Supabase dashboard) so member logins are shared between both sites.

## Making content editable without code changes

Right now, most content (officers, history, committee list, placeholder events/media) lives
in `src/data/placeholders.js` so the site works immediately with no backend setup. To make a
section live-editable, create the corresponding Supabase table and the page will
automatically prefer live data over placeholders:

| Page | Table | Columns |
|---|---|---|
| Events | `events` | `title`, `event_date`, `location`, `description` |
| Committees | `committee_documents` | `committee_slug`, `title`, `file_url`, `category` |
| Media | `media_items` | `title`, `type` (`image`/`video`), `url`, `created_at` |

For file uploads (forms, photos, videos), upload to a Supabase Storage bucket and put the
public URL in `file_url` / `url`.

Suggested next step: add simple admin forms inside the Brothers Only dashboard
(`src/pages/brothers/Dashboard.jsx`) so committee members can add events/documents/media
without touching Supabase directly.

## Brand colors

Defined in `src/index.css` as Tailwind theme tokens: `omega-purple`, `omega-purple-dark`,
`omega-gold`, `omega-gold-light`. Swap these for your chapter's exact colors if needed.

## Deployment

Deploy to Vercel just like `app.etaomicron.org`:

```bash
npm run build
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Environment Variables in the Vercel
project settings (same values as your `.env`), plus `VITE_SITE_URL` (the site's public address, used
for canonical URLs and the sitemap). They must be available at **build** time, since pages are
prerendered with live data.

## Not included yet (intentionally left for you to decide/build)

- Real chapter content (history, officer bios/photos, committee descriptions).
- Admin UI for adding events/documents/media (currently done directly in Supabase).
- Row Level Security policies restricting who can write to `events`, `committee_documents`,
  `media_items` (read is public; you'll want writes limited to signed-in members).
