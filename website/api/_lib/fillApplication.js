// Writes an online essay contest application onto the official PDF packet (which has no form
// fields): the Title Page (p.4), Essay Release (p.5), Media Release & Consent (p.6), Submission
// Checklist (p.9), and the chapter box + eligibility ticks on p.2.
//
// Positions are in PDF points measured from the top of the page (as read off the 2026–2027
// packet). If a future year's packet moves things around, adjust the numbers below and check the
// result with scripts/test-essay-pdf.mjs.

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { isMinor } from '../../src/lib/essayApplication.js'

const PAGE_H = 792
const INK = rgb(0.05, 0.1, 0.35) // dark blue, so filled-in answers stand out from the printed form
const GRAY = rgb(0.35, 0.35, 0.4)

export async function fillApplication(templateBytes, app, contest, meta) {
  const pdf = await PDFDocument.load(templateBytes, { ignoreEncryption: true })
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const script = await pdf.embedFont(StandardFonts.TimesRomanItalic)
  const pages = pdf.getPages()
  const page = (n) => pages[n - 1]

  const s = app.student
  const h = app.school
  const p = app.parent || {}
  const minor = isMinor(s.age)
  const studentName = `${s.first} ${s.last}`.trim()
  const date = meta.date

  const clean = makeCleaner(font)
  const cleanScript = makeCleaner(script)

  /** Text on one line: shrinks to fit `width`, down to 7pt, then trims. */
  function put(pg, text, x, top, width, size = 10, f = font) {
    let t = (f === font ? clean : cleanScript)(String(text ?? '').replace(/\s+/g, ' ').trim())
    if (!t) return
    let sz = size
    while (sz > 7 && f.widthOfTextAtSize(t, sz) > width) sz -= 0.5
    while (t.length > 1 && f.widthOfTextAtSize(t, sz) > width) t = t.slice(0, -2) + '…'
    pg.drawText(t, { x, y: PAGE_H - top - 9, size: sz, font: f, color: INK })
  }

  /** Wrapped text, up to `maxLines` lines. */
  function wrap(pg, text, x, top, width, size, lineGap, maxLines) {
    const words = clean(String(text || '')).split(/\s+/).filter(Boolean)
    const lines = []
    let line = ''
    for (const w of words) {
      const next = line ? `${line} ${w}` : w
      if (font.widthOfTextAtSize(next, size) <= width) line = next
      else {
        lines.push(line)
        line = w
      }
    }
    if (line) lines.push(line)
    lines.slice(0, maxLines).forEach((l, i) => {
      pg.drawText(l, { x, y: PAGE_H - top - 9 - i * lineGap, size, font, color: INK })
    })
  }

  function check(pg, x, top) {
    // Tick drawn inside a printed "☐" box whose glyph starts at x.
    const b = PAGE_H - top - 10.2
    pg.drawLine({ start: { x: x + 1.6, y: b + 4.4 }, end: { x: x + 3.9, y: b + 1.8 }, thickness: 1.3, color: INK })
    pg.drawLine({ start: { x: x + 3.9, y: b + 1.8 }, end: { x: x + 8.6, y: b + 8.6 }, thickness: 1.3, color: INK })
  }

  /** A signature sitting on a printed line: the drawn image if there is one, else the typed name. */
  function sign(pg, sig, x, lineTop, width, height) {
    if (!sig?.typed) return
    const bottom = PAGE_H - lineTop + 1.5
    if (sig.image) {
      const img = sig.embedded
      const scale = Math.min(width / img.width, height / img.height)
      const w = img.width * scale
      pg.drawImage(img, { x, y: bottom, width: w, height: img.height * scale })
    } else {
      let sz = 15
      const t = cleanScript(sig.typed.trim())
      while (sz > 8 && script.widthOfTextAtSize(t, sz) > width) sz -= 0.5
      pg.drawText(t, { x: x + 2, y: bottom + 3, size: sz, font: script, color: INK })
    }
  }

  function audit(pg, top) {
    const who = [`${studentName} (student)`, minor && p.name ? `${p.name} (parent/guardian)` : null].filter(Boolean).join(' and ')
    pg.drawText(clean(`Signed electronically by ${who} at ${meta.site} on ${meta.timestamp}. Ref ${meta.ref}.`), {
      x: 40.6,
      y: PAGE_H - top - 6,
      size: 6.5,
      font,
      color: GRAY,
    })
  }

  for (const who of ['student', 'parent']) {
    const sig = app.signatures?.[who]
    if (sig?.image) sig.embedded = await pdf.embedPng(Buffer.from(sig.image, 'base64'))
  }
  const studentSig = app.signatures?.student
  const parentSig = minor ? app.signatures?.parent : null

  // ---- Page 2: the chapter's box, and the eligibility boxes the student confirmed --------------
  const p2 = page(2)
  put(p2, contest.chapterName, 142, 523.7, 248)
  put(p2, contest.contactName, 145, 547.3, 245)
  put(p2, contest.submitEmail, 202, 570.9, 188)
  put(p2, contest.contactPhone, 105, 594.6, 285)
  put(p2, contest.deadlineText, 198, 618, 150)
  for (const top of [309.4, 325.5, 339.9, 353.9, 369.6, 653.0, 665.6, 678.2, 692.1]) check(p2, 78.1, top)

  // ---- Page 4: Title Page ------------------------------------------------------------------------
  const p4 = page(4)
  // Replace the "**Entered Annually by IAWC**" placeholder with this year's topic.
  p4.drawRectangle({ x: 125, y: PAGE_H - 245, width: 240, height: 15, color: rgb(1, 1, 1) })
  wrap(p4, contest.topic, 127.2, 231.5, 440, 9, 11, 2)
  put(p4, app.essay.title, 127.2, 283, 440)
  put(p4, studentName, 101, 373, 192)
  put(p4, s.email, 332, 373, 235)
  const addressRow = (pg, a, top, cols) => {
    put(pg, a.street, cols[0], top, cols[1] - cols[0] - 4)
    put(pg, a.city, cols[1], top, cols[2] - cols[1] - 4)
    put(pg, a.state, cols[2], top, cols[3] - cols[2] - 3)
    put(pg, a.zip, cols[3], top, cols[4] - cols[3])
  }
  addressRow(p4, s, 401.5, [101, 299, 442.5, 491.7, 567])
  put(p4, h.name, 101, 488, 450)
  addressRow(p4, h, 516.8, [101, 299, 442.5, 491.7, 567])
  put(p4, contest.chapterName, 101, 603.3, 450)
  put(p4, contest.chapterLocation?.area, 105, 632, 260)
  put(p4, contest.chapterLocation?.city, 370, 632, 150)
  put(p4, contest.chapterLocation?.state, 524, 632, 45)

  // ---- Pages 5 and 6: Essay Release, Media Release & Consent (same layout, shifted) -------------
  const releaseHeader = (pg, t) => {
    put(pg, studentName, 96, t.name, 196)
    put(pg, s.email, 339, t.name, 230)
    put(pg, s.age, 96, t.age, 120)
    put(pg, s.homePhone, 292, t.age, 115)
    put(pg, s.cellPhone, 476, t.age, 92)
    addressRow(pg, s, t.addr, [96, 316, 451, 485, 568])
    put(pg, p.name, 96, t.parent, 196)
    put(pg, p.email, t.parentEmailX, t.parent, 230)
    put(pg, p.homePhone, 96, t.phones, 120)
    put(pg, p.cellPhone, 292, t.phones, 115)
  }

  const p5 = page(5)
  releaseHeader(p5, { name: 190, age: 211.5, addr: 233, parent: 287.5, phones: 308, parentEmailX: 339 })
  put(p5, studentName, 298, 335.7, 160)
  // The Essay Release is signed by the student if 18+, otherwise by the parent/guardian.
  if (!minor) {
    sign(p5, studentSig, 41, 703, 178, 24)
    put(p5, date, 239, 690, 45)
  }
  if (parentSig) {
    sign(p5, parentSig, 297, 703, 196, 24)
    put(p5, date, 509, 690, 58)
  }
  audit(p5, 732)

  const p6 = page(6)
  releaseHeader(p6, { name: 198.5, age: 220, addr: 241.7, parent: 302.8, phones: 323, parentEmailX: 338.5 })
  sign(p6, studentSig, 41, 733, 182, 24)
  put(p6, date, 239, 720, 52)
  if (parentSig) {
    sign(p6, parentSig, 306, 733, 183, 24)
    put(p6, date, 505, 720, 62)
  }
  audit(p6, 746)

  // ---- Page 9: Submission Checklist ---------------------------------------------------------------
  const p9 = page(9)
  const boxes = [322.6, 338.1, 354.2, 369.8, 385.6, 401.6, 415.0, 427.4, 439.7, 450.7, 464.0, 482.1, 523.2, 539.0, 555.8]
  const ticks = app.consents?.checklist || []
  boxes.forEach((top, i) => ticks[i] && check(p9, 78.1, top))
  put(p9, studentName, 142, 610.6, 275)
  sign(p9, studentSig, 119, 644, 280, 20)
  put(p9, date, 98, 657.7, 200)

  pdf.setTitle(`${contest.year} Essay Contest Application – ${studentName}`)
  pdf.setSubject('Omega Psi Phi International High School Essay Contest')
  pdf.setProducer('etaomicron.org')
  return pdf.save()
}

/** Characters the standard PDF fonts can't draw (emoji, some accents) become "?" instead of failing. */
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
