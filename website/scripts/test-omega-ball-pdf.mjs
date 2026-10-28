// Fills the Omega Ball agreement with sample answers so positions can be checked by eye.
// Usage: node scripts/test-omega-ball-pdf.mjs [signature.png] [out.pdf]
import { readFile, writeFile } from 'node:fs/promises'
import { fillOmegaBall } from '../api/_lib/fillOmegaBall.js'
import { formatDate, validateAgreement } from '../src/lib/omegaBallAgreement.js'

const [sigPath, out = 'omega-ball-test.pdf'] = process.argv.slice(2)
const a = {
  brother: { name: 'Jonathan Q. Brother', phone: '(229) 555-0142', email: 'jonathan.brother@example.com' },
  schedule: {
    deposit: { date: '2026-10-30', amount: '120' },
    i1: { date: '2026-11-07', amount: '90' },
    i2: { date: '2026-11-21', amount: '90' },
    i3: { date: '2026-12-01', amount: '90' },
    i4: { date: '2026-12-15', amount: '90' },
    extra: { date: '', amount: '' },
  },
  agree: { terms: true, acknowledgment: true },
  signature: { typed: 'Jonathan Q. Brother', image: sigPath ? (await readFile(sigPath)).toString('base64') : null },
}
console.log('validation errors:', validateAgreement(a, new Date('2026-10-28T12:00:00-04:00')))
const bytes = await fillOmegaBall(await readFile('public/files/2026_Omega_Ball_Table_Agreement.pdf'), a, {
  ref: 'A1B2C3', site: 'www.etaomicron.org', date: 'October 28, 2026', timestamp: '10/28/26, 3:55 PM ET', year: 2026, formatDate,
})
await writeFile(out, bytes)
console.log('wrote', out)
