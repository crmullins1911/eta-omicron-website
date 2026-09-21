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
project settings (same values as your `.env`).

## Not included yet (intentionally left for you to decide/build)

- Real chapter content (history, officer bios/photos, committee descriptions).
- Admin UI for adding events/documents/media (currently done directly in Supabase).
- Row Level Security policies restricting who can write to `events`, `committee_documents`,
  `media_items` (read is public; you'll want writes limited to signed-in members).
