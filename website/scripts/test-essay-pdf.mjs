// Fills the essay contest PDF with sample answers so the layout can be checked by eye:
//   node scripts/test-essay-pdf.mjs [signature.png] [out.pdf]
import { readFileSync, writeFileSync } from 'node:fs'
import { fillApplication } from '../api/_lib/fillApplication.js'
import { essayContest } from '../src/data/essayContest.js'
import { CHECKLIST, signingDate } from '../src/lib/essayApplication.js'

const [sigPath, out = 'essay-test.pdf', age = '17'] = process.argv.slice(2)
const sig = sigPath ? readFileSync(sigPath).toString('base64') : null
const app = {
  student: { first: 'Jordan', last: 'Williams-Harrington', email: 'jordan.williams@example.com', age, homePhone: '(803) 555-0142', cellPhone: '(803) 555-0199', street: '1234 Magnolia Plantation Road', city: 'St. Matthews', state: 'SC', zip: '29135' },
  school: { name: 'Calhoun County High School', street: '150 Saints Avenue', city: 'St. Matthews', state: 'SC', zip: '29135' },
  parent: { name: 'Denise Williams', email: 'denise.williams@example.com', homePhone: '(803) 555-0142', cellPhone: '(803) 555-0177' },
  essay: { title: 'Lifting As We Climb: Leadership That Starts at Home' },
  consents: { checklist: CHECKLIST.map(() => true) },
  signatures: { student: { typed: 'Jordan Williams-Harrington', image: sig }, parent: { typed: 'Denise Williams', image: null } },
}
const bytes = await fillApplication(readFileSync(new URL('../public/files/2026-2027-high-school-essay-contest-application.pdf', import.meta.url)), app, essayContest, {
  date: signingDate(),
  timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' ET',
  site: 'www.etaomicron.org',
  ref: 'TEST01',
})
writeFileSync(out, bytes)
console.log('wrote', out, bytes.length, 'bytes')
