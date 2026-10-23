// Build step 3 of 3 (after the browser bundle and the server renderer are built).
//
// Renders every public page to static HTML so visitors see real content before any JavaScript runs,
// and search engines get complete pages with titles, descriptions and structured data. For each page:
//   - fetch live data from Supabase (events, media, committee documents), falling back to placeholders
//   - render the page's HTML and write it to dist/<page>.html
//   - write the page's <head> tags (title, description, canonical, Open Graph, JSON-LD)
//   - preload exactly the JavaScript chunk that page needs
//   - embed the data as window.__EO_SEED__ so the browser's cache starts warm
// Then: sitemap.xml, robots.txt, an empty app shell for non-prerendered routes, and the service
// worker's build ID.

process.env.TZ = process.env.TZ || 'America/New_York' // "upcoming" is decided in the chapter's time zone

import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import crypto from 'node:crypto'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')
const ssrDir = path.join(root, 'dist-ssr')

const server = await import(pathToFileURL(path.join(ssrDir, 'entry-server.js')).href)
const { render, headTagsHtml, safeJson, SITE_URL, publicPaths, privatePrerenderPaths, pageForPath, prerenderQueries, eventsQuery } = server

const template = await fs.readFile(path.join(dist, 'index.html'), 'utf8')
const manifest = JSON.parse(await fs.readFile(path.join(dist, '.vite', 'manifest.json'), 'utf8'))
const builtAt = Date.now()
const buildId = crypto.createHash('sha1').update(template + builtAt).digest('hex').slice(0, 10)

// ---- 1. data ---------------------------------------------------------------------------------

const data = {}
let live = 0
for (const q of prerenderQueries()) {
  try {
    const result = await q.fetch()
    data[q.key] = { data: result, at: builtAt, source: 'live' }
    live++
  } catch (err) {
    // Supabase not configured or unreachable at build time: pages render with placeholders and the
    // browser fetches live data as usual.
    console.warn(`  [prerender] ${q.key}: ${err.message} (using placeholders)`)
  }
}
const seed = { builtAt, data }

// ---- 2. pages --------------------------------------------------------------------------------

const routes = [...publicPaths, ...privatePrerenderPaths]
for (const route of routes) {
  const appHtml = await render(route, seed)
  const events = data[eventsQuery.key]?.data ?? eventsQuery.fallback
  const today = new Date(builtAt)
  today.setHours(0, 0, 0, 0)
  const upcoming = events.filter((e) => localDate(e.date) >= today.getTime())

  const head = [
    headTagsHtml(route, { events: route === '/' ? upcoming.slice(0, 3) : upcoming }),
    ...modulePreloads(route),
  ].join('\n    ')

  const html = template
    .replace(/<title>[\s\S]*?<\/title>\s*/, '')
    .replace(/<meta name="description"[^>]*>\s*/, '')
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>\n    <script>window.__EO_SEED__=${safeJson(seed)}</script>`)

  const file = route === '/' ? 'index.html' : `${route.slice(1)}.html`
  await fs.mkdir(path.dirname(path.join(dist, file)), { recursive: true })
  await fs.writeFile(path.join(dist, file), html)
  console.log(`  [prerender] ${route.padEnd(32)} -> dist/${file} (${(html.length / 1024).toFixed(1)} KB)`)
}

// ---- 3. app shell, sitemap, robots, service worker -----------------------------------------------

// Served (via vercel.json) for anything not prerendered, such as /brothers and unknown URLs.
await fs.writeFile(path.join(dist, 'app-shell.html'), template.replace('</head>', '    <meta name="robots" content="noindex" />\n  </head>'))

const lastmod = new Date(builtAt).toISOString().slice(0, 10)
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publicPaths
  .map(
    (p) =>
      `  <url><loc>${SITE_URL}${p === '/' ? '/' : p}</loc><lastmod>${lastmod}</lastmod><changefreq>${p === '/' || p === '/events' ? 'daily' : 'weekly'}</changefreq><priority>${p === '/' ? '1.0' : p === '/events' ? '0.9' : '0.7'}</priority></url>`
  )
  .join('\n')}
</urlset>
`
await fs.writeFile(path.join(dist, 'sitemap.xml'), sitemap)
await fs.writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /brothers\n\nSitemap: ${SITE_URL}/sitemap.xml\n`)

const swPath = path.join(dist, 'sw.js')
await fs.writeFile(swPath, (await fs.readFile(swPath, 'utf8')).replace('__BUILD_ID__', buildId))

await fs.rm(ssrDir, { recursive: true, force: true })
await fs.rm(path.join(dist, '.vite'), { recursive: true, force: true }) // build manifest isn't needed online
console.log(`  [prerender] ${routes.length} pages, ${live} live data sets, build ${buildId}`)

// ---- helpers ---------------------------------------------------------------------------------

function localDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''))
  return m ? new Date(+m[1], +m[2] - 1, +m[3]).getTime() : new Date(s).getTime()
}

/** <link rel="modulepreload"> for the page's own chunk and the chunks it imports. */
function modulePreloads(route) {
  const page = pageForPath(route)
  if (!page?.file || !manifest[page.file]) return []
  const files = new Set()
  const walk = (key) => {
    const entry = manifest[key]
    if (!entry || files.has(entry.file)) return
    if (!entry.isEntry) files.add(entry.file)
    ;(entry.imports || []).forEach(walk)
  }
  walk(page.file)
  return [...files].filter((f) => !template.includes(`/${f}"`)).map((f) => `<link rel="modulepreload" crossorigin href="/${f}" />`)
}
