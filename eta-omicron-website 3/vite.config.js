import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Lets scripts/prerender.mjs find each page's code chunk and preload it in that page's HTML.
    manifest: true,
  },
})
