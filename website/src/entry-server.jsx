// Build-time renderer used by scripts/prerender.mjs. Not shipped to browsers.

import { StrictMode } from 'react'
import { prerenderToNodeStream } from 'react-dom/static'
import { StaticRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { setServerSeed } from './lib/cache'

export { headTagsHtml, safeJson, SITE_URL } from './seo'
export { publicPaths, privatePrerenderPaths, pageForPath } from './routes'
export { prerenderQueries, eventsQuery } from './lib/queries'

/** Render a URL to HTML, waiting for every lazy page and Suspense boundary to resolve. */
export async function render(url, seed) {
  setServerSeed(seed)
  const { prelude } = await prerenderToNodeStream(
    <StrictMode>
      <StaticRouter location={url}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </StaticRouter>
    </StrictMode>
  )
  const chunks = []
  for await (const chunk of prelude) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}
