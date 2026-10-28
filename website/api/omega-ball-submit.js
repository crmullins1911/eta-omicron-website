// POST /api/omega-ball-submit — online Omega Ball Table Reservation & Payment Installment Agreement.
//
// Checks the agreement, writes it onto the chapter's PDF (api/_lib/fillOmegaBall.js) with the
// Brother's drawn signature, and emails it to the chapter (src/data/omegaBall.js → submitEmail).
// The Brother gets a copy. Nothing is stored on the website: the email is the record.
//
// Uses the same Gmail settings as the essay contest form (Vercel → Environment Variables):
//   GMAIL_USER, GMAIL_APP_PASSWORD

import { readFile } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import nodemailer from 'nodemailer'
import { omegaBall as b } from '../src/data/omegaBall.js'
import { LIMITS, ROWS, amountOf, formatDate, money, validateAgreement } from '../src/lib/omegaBallAgreement.js'
import { fillOmegaBall } from './_lib/fillOmegaBall.js'

const SITE = 'www.etaomicron.org'

export const config = { maxDuration: 30 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST.' })

  try {
    if (!b.openForm) return send(res, 403, { error: 'Online table agreements are turned off.', code: 'closed' })
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return send(res, 503, { error: 'Online submission is not set up yet.', code: 'not_configured' })
    }

    const a = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    if (!a || typeof a !== 'object') return send(res, 400, { error: 'Empty form.' })
    if (a.website) return send(res, 200, { ok: true, ref: 'OK' }) // honeypot

    const errors = validateAgreement(a)
    const img = a.signature?.image
    if (img && (typeof img !== 'string' || img.length > LIMITS.signatureBytes * 1.4 || !isPng(Buffer.from(img, 'base64')))) {
      errors['signature.image'] = 'The signature could not be read. Clear it and sign again.'
    }
    if (Object.keys(errors).length) return send(res, 422, { error: 'Some answers need attention.', errors })

    const ref = randomBytes(3).toString('hex').toUpperCase()
    const now = new Date()
    const meta = {
      ref,
      site: SITE,
      year: b.year,
      formatDate,
      date: formatDate(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(now)),
      timestamp: `${now.toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'short', timeStyle: 'short' })} ET`,
    }

    const pdfBytes = await fillOmegaBall(await loadTemplate(req), a, meta)
    const name = a.brother.name.trim()
    const email = a.brother.email.trim()
    const fileBase = name.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'Brother'
    const attachment = { filename: `${b.year}_Omega_Ball_Table_Agreement_${fileBase}.pdf`, content: Buffer.from(pdfBytes), contentType: 'application/pdf' }

    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    })
    const from = { name: 'Eta Omicron Omega Ball', address: process.env.GMAIL_USER }

    // 1) To the chapter.
    await transport.sendMail({
      from,
      to: b.submitEmail,
      replyTo: email,
      subject: `${b.year} Omega Ball Table Agreement – ${name} [${ref}]`,
      text: summary(a, meta),
      attachments: [attachment],
    })

    // 2) A copy to the Brother. A failure here doesn't undo the submission.
    let copySent = true
    try {
      await transport.sendMail({
        from,
        to: email,
        replyTo: b.submitEmail,
        subject: `Your ${b.year} Omega Ball table agreement [${ref}]`,
        text: receipt(a, meta),
        attachments: [attachment],
      })
    } catch (err) {
      copySent = false
      console.error('[omega-ball-submit] receipt failed', err?.message)
    }

    return send(res, 200, { ok: true, ref, copySent })
  } catch (err) {
    console.error('[omega-ball-submit]', err?.message)
    const auth = /invalid login|username and password|535|EAUTH/i.test(String(err?.message || err?.code))
    return send(res, 500, {
      error: auth ? 'The chapter email account rejected the login.' : 'Something went wrong sending the agreement.',
      code: auth ? 'mail_auth' : 'server',
    })
  }
}

function send(res, status, body) {
  res.status(status).setHeader('Cache-Control', 'no-store').json(body)
}

async function loadTemplate(req) {
  try {
    return await readFile(`${process.cwd()}/public${b.pdf}`)
  } catch {
    const host = req.headers['x-forwarded-host'] || req.headers.host
    const r = await fetch(`https://${host}${b.pdf}`)
    if (!r.ok) throw new Error(`Could not load the agreement PDF (${r.status})`)
    return Buffer.from(await r.arrayBuffer())
  }
}

function isPng(buf) {
  return buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
}

function scheduleLines(a) {
  return ROWS.filter((r) => a.schedule[r.key]?.date).map(
    (r) => `  ${r.label.padEnd(22)} ${formatDate(a.schedule[r.key].date).padEnd(20)} ${money(amountOf(a.schedule[r.key].amount))}`
  )
}

function summary(a, meta) {
  const br = a.brother
  return [
    `New ${b.year} Omega Ball table reservation & payment installment agreement, submitted online at ${SITE} on ${meta.timestamp}.`,
    `Reference: ${meta.ref}`,
    '',
    'REQUESTING BROTHER',
    `Name:  ${br.name.trim()}`,
    `Phone: ${br.phone.trim()}`,
    `Email: ${br.email.trim()}`,
    '',
    'PAYMENT SCHEDULE',
    ...scheduleLines(a),
    `  ${'Total'.padEnd(43)} ${money(b.tableCost)}`,
    '',
    `Agreed to the terms and conditions and the acknowledgment, and signed electronically on ${meta.date}.`,
    '',
    'NEXT STEPS FOR THE CHAPTER',
    '- Keeper of Records and Seal: sign page 4 of the attached agreement.',
    `- The table is secured once the ${money(b.deposit)} deposit is received; record it in "For Chapter Records Only".`,
    '',
    'Reply to this email to contact the Brother.',
  ].join('\n')
}

function receipt(a, meta) {
  return [
    `Brother ${a.brother.name.trim()},`,
    '',
    `Thank you for reserving a table for the ${b.year} Omega Ball on ${b.eventDateText}. Your signed table reservation & payment installment agreement is attached. Reference: ${meta.ref}.`,
    '',
    'YOUR PAYMENT SCHEDULE',
    ...scheduleLines(a),
    `  ${'Total'.padEnd(43)} ${money(b.tableCost)}`,
    '',
    `Your table is secured once your ${money(b.deposit)} deposit is received. All payments must be received in full by ${b.deadlineText}.`,
    '',
    'HOW TO PAY',
    ...b.paymentMethods.map(([k, v]) => `  ${k}: ${v}`),
    `  Please note "${b.paymentMemo}" with each payment.`,
    '',
    'The agreement becomes valid once it is signed by the Keeper of Records and Seal and your deposit is received.',
    `Questions or changes to your schedule: reply to this email or write to ${b.submitEmail}.`,
    '',
    'Eta Omicron Chapter, Omega Psi Phi Fraternity, Inc.',
  ].join('\n')
}
