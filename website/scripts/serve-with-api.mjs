// Local test server: serves the built site (dist/) and runs api/essay-submit.js, with outgoing
// email captured to a folder instead of sent. For checking the online application end to end:
//   npm run build && node scripts/serve-with-api.mjs <capture-folder> [port]
import http from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import nodemailer from 'nodemailer'

const [capture = 'mail-capture', port = 4180] = process.argv.slice(2)
await mkdir(capture, { recursive: true })
process.env.GMAIL_USER ||= 'test-sender@example.com'
process.env.GMAIL_APP_PASSWORD ||= 'test'
let n = 0
nodemailer.createTransport = () => ({
  async sendMail(m) {
    const dir = join(capture, String(++n))
    await mkdir(dir, { recursive: true })
    await writeFile(join(dir, 'message.json'), JSON.stringify({ ...m, attachments: m.attachments?.map((a) => a.filename) }, null, 2))
    for (const a of m.attachments || []) await writeFile(join(dir, a.filename), a.content)
    return { messageId: `test-${n}` }
  },
})
const { default: handler } = await import('../api/essay-submit.js')
const dist = fileURLToPath(new URL('../dist/', import.meta.url))
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.json': 'application/json', '.xml': 'text/xml', '.txt': 'text/plain' }

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x')
    if (url.pathname === '/api/essay-submit') {
      const chunks = []
      for await (const c of req) chunks.push(c)
      const raw = Buffer.concat(chunks)
      if (raw.length > 4.5 * 1024 * 1024) return res.writeHead(413).end('too large') // Vercel's request limit
      req.body = raw.length ? JSON.parse(raw) : undefined
      res.status = (code) => ((res.statusCode = code), res)
      res.json = (body) => (res.setHeader('Content-Type', 'application/json'), res.end(JSON.stringify(body)))
      return handler(req, res)
    }
    for (const f of [url.pathname, `${url.pathname}.html`, `${url.pathname}/index.html`, '/app-shell.html']) {
      try {
        const body = await readFile(join(dist, decodeURIComponent(f)))
        res.writeHead(200, { 'Content-Type': types[extname(f)] || 'application/octet-stream' })
        return res.end(body)
      } catch {
        /* next */
      }
    }
    res.writeHead(404).end()
  })
  .listen(port, () => console.log(`http://localhost:${port}  (mail → ${capture})`))
