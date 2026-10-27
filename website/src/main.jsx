import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { startHydration } from './lib/hydration'
import { preloadPath } from './routes'
import { initRum, reportHydrationIssue } from './lib/rum'
import { registerServiceWorker } from './lib/serviceWorker'
import { initDepth } from './lib/depth'

// Rendering happens in phases:
//
//   1. The browser paints the prerendered HTML immediately (built by scripts/prerender.mjs), with
//      real content and the critical CSS. No JavaScript is needed to see the page.
//   2. This script loads, fetches only the current page's code chunk, and hydrates. Below-the-fold
//      sections (<LazyHydrate>) stay static until they scroll near the viewport.
//   3. Once idle: the service worker registers and likely next pages are prefetched.
//
// Real-user monitoring starts first, before hydration, so even visitors who leave within a second
// or two are counted (they are exactly the bounces worth knowing about). It only queues events;
// sending is batched and happens later.

initRum()

const container = document.getElementById('root')
const prerendered = container.hasChildNodes()

const app = (
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)

if (prerendered) {
  startHydration()
  // Load this page's chunk first so hydration happens in one pass instead of suspending.
  preloadPath(window.location.pathname).then(() =>
    hydrateRoot(container, app, {
      onRecoverableError(error) {
        // The page's HTML didn't match what the browser rendered, so React re-rendered that part.
        // Nothing is broken for the visitor; it is reported to monitoring so it can be fixed.
        reportHydrationIssue(error)
        if (import.meta.env.DEV) console.warn('[hydrate]', error)
      },
    })
  )
} else {
  createRoot(container).render(app)
}

// 3D scroll and cursor-tilt effects (mostly CSS; see src/lib/depth.js).
initDepth()

const whenIdle = (fn) =>
  'requestIdleCallback' in window ? window.requestIdleCallback(fn, { timeout: 4000 }) : setTimeout(fn, 2000)

if (document.readyState === 'complete') whenIdle(afterLoad)
else window.addEventListener('load', () => whenIdle(afterLoad), { once: true })

function afterLoad() {
  if (import.meta.env.PROD) registerServiceWorker()
}
