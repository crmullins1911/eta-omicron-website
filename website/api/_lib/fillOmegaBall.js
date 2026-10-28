// Writes an online Omega Ball table agreement onto the chapter's 4-page PDF (which has no form
// fields): the Brother's information (p.1), the installment schedule (p.2), and the requesting
// Brother's printed name, signature and date (p.4). The Keeper of Records and Seal section and the
// "For Chapter Records Only" box are left blank for the chapter to complete.
//
// Positions are PDF points measured from the top of the page, read off the 2026 agreement. If the
// PDF changes, adjust the numbers here and check with scripts/test-omega-ball-pdf.mjs.

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { ROWS, amountOf, money } from '../../src/lib/omegaBallAgreement.js'

const PAGE_H = 792
const INK = rgb(0.05, 0.1, 0.35)
const GRAY = rgb(0.35, 0.35, 0.4)

// Page 2 table: row text tops, and the date / amount columns.
const ROW_TOP = { deposit: 268, i1: 293.1, i2: 318.1, i3: 343.2, i4: 368.2, extra: 393.3 }
const DATE_COL = { x: 222, width: 168 }
const AMOUNT_COL = { x: 402, width: 168 }

export async function fillOmegaBall(templateBytes, a, meta) {
  const pdf = await PDFDocument.load(templateBytes, { ignoreEncryption: true })
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const script = await pdf.embedFont(StandardFonts.TimesRomanItalic)
  const [p1, p2, , p4] = pdf.getPages()
  const clean = makeCleaner(font)
  const cleanScript = makeCleaner(script)

  function put(pg, text, x, top, width, size = 11, { center = false } = {}) {
    let t = clean(String(text ?? '').replace(/\s+/g, ' ').trim())
    if (!t) return
    let sz = size
    while (sz > 7 && font.widthOfTextAtSize(t, sz) > width) sz -= 0.5
    while (t.length > 1 && font.widthOfTextAtSize(t, sz) > width) t = t.slice(0, -2) + '…'
    const w = font.widthOfTextAtSize(t, sz)
    pg.drawText(t, { x: center ? x + (width - w) / 2 : x, y: PAGE_H - top - 10, size: sz, font, color: INK })
  }

  const br = a.brother
  const name = br.name.trim()

  // ---- Page 1: requesting Brother's information --------------------------------------------------
  put(p1, name, 104, 310, 274)
  put(p1, br.phone, 154, 335.8, 222)
  put(p1, br.email, 130, 361.6, 248)

  // ---- Page 2: installment schedule -----------------------------------------------------------------
  for (const r of ROWS) {
    const row = a.schedule[r.key] || {}
    const top = ROW_TOP[r.key]
    if (row.date) put(p2, meta.formatDate(row.date), DATE_COL.x, top, DATE_COL.width, 11, { center: true })
    // The deposit amount ($120.00) is already printed on the form.
    if (r.key !== 'deposit' && row.amount !== '' && row.amount != null) {
      put(p2, money(amountOf(row.amount)), AMOUNT_COL.x, top, AMOUNT_COL.width, 11, { center: true })
    }
  }

  // ---- Page 4: requesting Brother's printed name, signature and date ---------------------------------
  put(p4, a.signature.typed, 120, 312, 248)
  const sigLineBottom = PAGE_H - 349.5
  if (a.signature.image) {
    const img = await pdf.embedPng(Buffer.from(a.signature.image, 'base64'))
    const scale = Math.min(250 / img.width, 30 / img.height)
    p4.drawImage(img, { x: 100, y: sigLineBottom - 1, width: img.width * scale, height: img.height * scale })
  } else {
    p4.drawText(cleanScript(a.signature.typed.trim()), { x: 100, y: sigLineBottom + 3, size: 16, font: script, color: INK })
  }
  put(p4, meta.date, 72, 363.6, 290)
  p4.drawText(clean(`Signed electronically by ${name} at ${meta.site} on ${meta.timestamp}. Ref ${meta.ref}.`), {
    x: 36,
    y: PAGE_H - 384,
    size: 6.5,
    font,
    color: GRAY,
  })

  pdf.setTitle(`${meta.year} Omega Ball Table Agreement – ${name}`)
  pdf.setSubject('Omega Ball Table Reservation & Payment Installment Agreement')
  pdf.setProducer('etaomicron.org')
  return pdf.save()
}

function makeCleaner(font) {
  const ok = new Map()
  return (text) =>
    Array.from(String(text ?? ''))
      .map((ch) => {
        if (!ok.has(ch)) {
          try {
            font.encodeText(ch)
            ok.set(ch, true)
          } catch {
            ok.set(ch, false)
          }
        }
        return ok.get(ch) ? ch : '?'
      })
      .join('')
}
