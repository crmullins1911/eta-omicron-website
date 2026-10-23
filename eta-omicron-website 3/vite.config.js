import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Which Vercel project and deployment built this copy of the site (shown on /status).
const buildInfo = {
  project: process.env.VERCEL_PROJECT_PRODUCTION_URL || '',
  deployment: process.env.VERCEL_URL || '',
  env: process.env.VERCEL_ENV || 'local',
  branch: process.env.VERCEL_GIT_COMMIT_REF || '',
  commit: (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7),
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __BUILD_INFO__: JSON.stringify(buildInfo),
  },
  build: {
    // Lets scripts/prerender.mjs find each page's code chunk and preload it in that page's HTML.
    manifest: true,
  },
})
