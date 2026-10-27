// POST /api/essay-submit — online High School Essay Contest application.
//
// Checks the application, writes it onto the official PDF packet (api/_lib/fillApplication.js),
// and emails the filled forms + the student's essay + photo to the contest's submission address
// (src/data/essayContest.js → submitEmail). The student (and parent/guardian) get a copy of the
// signed forms. Nothing is stored on the website: the email is the record.
//
// Sending uses the chapter's Gmail account. Set these in Vercel → eta-omicron-website-production →
// Settings → Environment Variables, then redeploy:
//   GMAIL_USER          the Gmail address that sends (e.g. EtaOmicronQues@gmail.com)
//   GMAIL_APP_PASSWORD  a Google "app password" for that account (16 letters), not its normal password

import { readFile } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import nodemailer from 'nodemailer'
import { essayContest as contest } from '../src/data/essayContest.js'
import { LIMITS, isMinor, signingDate, validateApplication } from '../src/lib/essayApplication.js'
import { fillApplication } from './_lib/fillApplication.js'

const SITE = 'www.etaomicron.org'

export const config = { maxDuration: 30 }

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Use POST.' })

  try {
    if (!contest.onlineApplication) return send(res, 403, { error: 'Online applications are turned off.', code: 'closed' })
    if (Date.now() > new Date(contest.deadline).getTime()) {
      return send(res, 403, { error: `The deadline (${contest.deadlineText}) has passed.`, code: 'closed' })
    }
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return send(res, 503, { error: 'Online submission is not set up yet.', code: 'not_configured' })
    }

    const app = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    if (!app || typeof app !== 'object') return send(res, 400, { error: 'Empty application.' })
    if (app.website) return send(res, 200, { ok: true, ref: 'OK' }) // honeypot: a bot filled the hidden field

    const errors = validateApplication(app)
    const essay = decodeFile(app.essay?.file, LIMITS.essayBytes, ['doc', 'docx'])
    const photo = decodeFile(app.photo, LIMITS.photoBytes, ['jpg', 'png'])
    if (essay.error) errors['essay.file'] = essay.error
    if (photo.error) errors['photo'] = photo.error
    for (const who of ['student', 'parent']) {
      const img = app.signatures?.[who]?.image
      if (img && (typeof img !== 'string' || img.length > LIMITS.signatureBytes * 1.4 || kind(Buffer.from(img, 'base64')) !== 'png')) {
        errors[`signatures.${who}.typed`] = 'The drawn signature could not be read. Clear it and sign again.'
      }
    }
    if (Object.keys(errors).length) return send(res, 422, { error: 'Some answers need attention.', errors })

    const minor = isMinor(app.student.age)
    if (!minor) app.signatures.parent = null

    const ref = randomBytes(3).toString('hex').toUpperCase()
    const now = new Date()
    const meta = {
      ref,
      site: SITE,
      date: signingDate(now),
      timestamp: `${now.toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'short', timeStyle: 'short' })} ET`,
    }

    const template = await loadTemplate(req)
    const formsPdf = await fillApplication(template, app, contest, meta)

    const s = app.student
    const name = `${s.first.trim()} ${s.last.trim()}`
    const fileBase = `${s.last}_${s.first}`.replace(/[^A-Za-z0-9_-]+/g, '') || 'Applicant'
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    })
    const from = { name: 'Eta Omicron Essay Contest', address: process.env.GMAIL_USER }
    const formsAttachment = { filename: `${fileBase}_Application_Forms.pdf`, content: Buffer.from(formsPdf), contentType: 'application/pdf' }

    // 1) The application, to the chapter.
    await transport.sendMail({
      from,
      to: contest.submitEmail,
      replyTo: s.email.trim(),
      subject: `${contest.year} Essay Contest Application – ${name} (${app.school.name.trim()}) [${ref}]`,
      text: summary(app, meta, minor),
      attachments: [
        formsAttachment,
        { filename: `${fileBase}_Essay.${essay.ext}`, content: essay.buffer },
        { filename: `${fileBase}_Photo.${photo.ext}`, content: photo.buffer },
      ],
    })

    // 2) A copy of the signed forms, to the student (and parent/guardian). A failure here doesn't
    //    undo the submission, which has already reached the chapter.
    let copySent = true
    try {
      const to = [s.email.trim(), minor && app.parent?.email ? app.parent.email.trim() : null].filter(Boolean)
      await transport.sendMail({
        from,
        to,
        replyTo: contest.submitEmail,
        subject: `We received your ${contest.year} Essay Contest application [${ref}]`,
        text: receipt(app, meta),
        attachments: [formsAttachment],
      })
    } catch (err) {
      copySent = false
      console.error('[essay-submit] receipt failed', err?.message)
    }

    return send(res, 200, { ok: true, ref, copySent })
  } catch (err) {
    console.error('[essay-submit]', err?.message)
    const auth = /invalid login|username and password|535|EAUTH/i.test(String(err?.message || err?.code))
    return send(res, 500, {
      error: auth ? 'The chapter email account rejected the login.' : 'Something went wrong sending the application.',
      code: auth ? 'mail_auth' : 'server',
    })
  }
}

function send(res, status, body) {
  res.status(status).setHeader('Cache-Control', 'no-store').json(body)
}

/** The blank application packet: bundled with this function (vercel.json → includeFiles), or the
 *  copy the website serves as a fallback. */
async function loadTemplate(req) {
  try {
    return await readFile(`${process.cwd()}/public${contest.pdf}`)
  } catch {
    const host = req.headers['x-forwarded-host'] || req.headers.host
    const r = await fetch(`https://${host}${contest.pdf}`)
    if (!r.ok) throw new Error(`Could not load the application PDF (${r.status})`)
    return Buffer.from(await r.arrayBuffer())
  }
}

function kind(buf) {
  if (buf.length < 8) return null
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpg'
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png'
  if (buf.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) return 'docx'
  if (buf.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))) return 'doc'
  return null
}

function decodeFile(file, maxBytes, allowed) {
  if (!file?.data || typeof file.data !== 'string') return { error: 'File missing.' }
  if (file.data.length > maxBytes * 1.4) return { error: 'File is too large.' }
  const buffer = Buffer.from(file.data, 'base64')
  if (buffer.length > maxBytes) return { error: 'File is too large.' }
  const ext = kind(buffer)
  if (!allowed.includes(ext)) {
    return { error: allowed.includes('docx') ? 'The essay must be a Microsoft Word file (.doc or .docx).' : 'The photo must be a JPEG or PNG image.' }
  }
  return { buffer, ext }
}

function summary(a, meta, minor) {
  const s = a.student
  const h = a.school
  const p = a.parent || {}
  const line = (label, v) => (v ? `${label}: ${v}` : null)
  return [
    `New ${contest.year} High School Essay Contest application, submitted online at ${SITE} on ${meta.timestamp}.`,
    `Reference: ${meta.ref}`,
    '',
    'STUDENT',
    line('Name', `${s.first} ${s.last}`),
    line('Email', s.email),
    line('Age', s.age),
    line('Cell', s.cellPhone),
    line('Home', s.homePhone),
    line('Address', `${s.street}, ${s.city}, ${s.state} ${s.zip}`),
    '',
    'HIGH SCHOOL',
    line('Name', h.name),
    line('Address', `${h.street}, ${h.city}, ${h.state} ${h.zip}`),
    '',
    'PARENT / GUARDIAN',
    line('Name', p.name) || 'Not given (student is 18 or older)',
    line('Email', p.email),
    line('Cell', p.cellPhone),
    line('Home', p.homePhone),
    '',
    'ESSAY',
    line('Title', a.essay.title),
    line('Word count (counted by the website)', a.essay.wordCount),
    '',
    'SIGNED ELECTRONICALLY',
    `Essay Release: ${minor ? `${p.name} (parent/guardian)` : `${s.first} ${s.last} (student)`}`,
    `Media Release & Consent: ${s.first} ${s.last} (student)${minor ? ` and ${p.name} (parent/guardian)` : ''}`,
    'Submission Checklist: all items confirmed by the student',
    '',
    'Attached: the filled-in application forms (PDF), the essay (Word) and the photo.',
    'Reply to this email to contact the student.',
  ]
    .filter((x) => x !== null)
    .join('\n')
}

function receipt(a, meta) {
  return [
    `Hello ${a.student.first.trim()},`,
    '',
    `Thank you for entering the ${contest.year} Omega Psi Phi International High School Essay Contest through the Eta Omicron Chapter. We received your application on ${meta.timestamp}.`,
    '',
    `Essay title: ${a.essay.title.trim()}`,
    `Reference: ${meta.ref}`,
    '',
    'A copy of your signed application forms is attached. Please keep it, along with a copy of your essay and photo, for your records.',
    '',
    `Questions? Reply to this email or write to ${contest.submitEmail}.`,
    '',
    'Eta Omicron Chapter',
    'Omega Psi Phi Fraternity, Inc.',
  ].join('\n')
}
