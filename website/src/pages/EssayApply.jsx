import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PageBanner from '../components/PageBanner'
import SignaturePad from '../components/SignaturePad'
import useNow from '../hooks/useNow'
import { intent } from '../lib/prefetch'
import { essayContest as c } from '../data/essayContest'
import { CHECKLIST, ESSAY_RELEASE, LIMITS, MEDIA_RELEASE, isMinor, signingDate, validateApplication } from '../lib/essayApplication'
import { countDocxWords } from '../lib/docxWords'

// Online application for the High School Essay Contest. On submit, api/essay-submit.js writes the
// answers onto the official PDF and emails it, with the essay and photo, to c.submitEmail.
//
// Typed answers are kept in this browser tab only (sessionStorage) so a reload doesn't lose them;
// they're cleared on submit and when the tab closes. Files and signatures are never saved.

const DRAFT_KEY = 'eo-essay-draft'
const empty = {
  student: { first: '', last: '', email: '', age: '', cellPhone: '', homePhone: '', street: '', city: '', state: '', zip: '' },
  school: { name: '', street: '', city: '', state: '', zip: '' },
  parent: { name: '', email: '', cellPhone: '', homePhone: '' },
  essay: { title: '', file: null, wordCount: null },
  photo: null,
  signatures: { student: { typed: '', image: null }, parent: { typed: '', image: null } },
  consents: { eligibility: false, essayRelease: false, mediaRelease: false, checklist: CHECKLIST.map(() => false) },
  website: '',
}

export default function EssayApply() {
  const now = useNow()
  const open = c.onlineApplication && now <= new Date(c.deadline).getTime()
  const [a, setA] = useState(empty)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ state: 'idle' }) // idle | sending | sent | failed
  const [fileNotes, setFileNotes] = useState({ essay: null, photo: null, photoUrl: null })
  const loaded = useRef(false)

  const minor = a.student.age !== '' && isMinor(a.student.age)
  const showParent = a.student.age === '' || minor

  // Restore typed answers after a reload (after hydration, so the HTML matches).
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null')
      if (saved) setA((x) => ({ ...x, student: { ...x.student, ...saved.student }, school: { ...x.school, ...saved.school }, parent: { ...x.parent, ...saved.parent }, essay: { ...x.essay, title: saved.title || '' } }))
    } catch {
      /* private mode etc. */
    }
    loaded.current = true
  }, [])
  useEffect(() => {
    if (!loaded.current || status.state === 'sent') return
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ student: a.student, school: a.school, parent: a.parent, title: a.essay.title }))
    } catch {
      /* ignore */
    }
  }, [a.student, a.school, a.parent, a.essay.title, status.state])

  const set = (path, value) => {
    // An answer that changes is no longer "missing": drop its error until the next submit.
    setErrors((prev) => {
      const hit = Object.keys(prev).filter((k) => path === k || path.startsWith(`${k}.`) || k.startsWith(`${path}.`) || (path.startsWith('signatures.') && k.startsWith(path.split('.').slice(0, 2).join('.'))))
      if (!hit.length) return prev
      const next = { ...prev }
      hit.forEach((k) => delete next[k])
      return next
    })
    setA((prev) => {
      const next = structuredClone(prev)
      const keys = path.split('.')
      let o = next
      keys.slice(0, -1).forEach((k) => (o = o[k]))
      o[keys.at(-1)] = value
      return next
    })
  }

  const field = (path, label, props = {}) => (
    <Field
      key={path}
      id={`f-${path}`}
      label={label}
      value={path.split('.').reduce((o, k) => o?.[k], a) ?? ''}
      onChange={(v) => set(path, v)}
      error={errors[path]}
      {...props}
    />
  )

  async function pickEssay(file) {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['doc', 'docx'].includes(ext)) {
      set('essay.file', null)
      setFileNotes((n) => ({ ...n, essay: { bad: true, text: 'Choose a Microsoft Word file (.doc or .docx).' } }))
      return
    }
    if (file.size > LIMITS.essayBytes) {
      set('essay.file', null)
      setFileNotes((n) => ({ ...n, essay: { bad: true, text: 'That file is over 1.5 MB. Remove any pictures from the essay and save it again.' } }))
      return
    }
    const [data, words] = await Promise.all([toBase64(file), ext === 'docx' ? countDocxWords(file) : null])
    setA((prev) => ({ ...prev, essay: { ...prev.essay, file: { name: file.name, data }, wordCount: words } }))
    setErrors((prev) => {
      const { ['essay.file']: _, ...rest } = prev
      return rest
    })
    let text = `${file.name} attached.`
    let warn = false
    if (words != null) {
      text = `${file.name}: about ${words} words.`
      if (words < 700 || words > 750) {
        text += ' The essay must be 700–750 words (headers and footers don’t count).'
        warn = true
      }
    }
    setFileNotes((n) => ({ ...n, essay: { bad: warn, text } }))
  }

  async function pickPhoto(file) {
    if (!file) return
    try {
      const data = await shrinkPhoto(file)
      set('photo', { name: file.name, data })
      setFileNotes((n) => {
        if (n.photoUrl) URL.revokeObjectURL(n.photoUrl)
        return { ...n, photo: null, photoUrl: URL.createObjectURL(file) }
      })
    } catch {
      set('photo', null)
      setFileNotes((n) => ({ ...n, photo: { bad: true, text: 'That photo couldn’t be opened. Choose a JPEG or PNG photo.' }, photoUrl: null }))
    }
  }

  async function submit(e) {
    e.preventDefault()
    const payload = a
    const found = validateApplication(payload)
    setErrors(found)
    if (Object.keys(found).length) {
      requestAnimationFrame(() => document.getElementById(`f-${Object.keys(found)[0]}`)?.focus())
      return
    }
    setStatus({ state: 'sending' })
    try {
      const res = await fetch('/api/essay-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await res.json().catch(() => ({}))
      if (res.ok && body.ok) {
        setStatus({ state: 'sent', ref: body.ref, copySent: body.copySent })
        try {
          sessionStorage.removeItem(DRAFT_KEY)
        } catch {
          /* ignore */
        }
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      if (res.status === 422 && body.errors) {
        setErrors(body.errors)
        setStatus({ state: 'idle' })
        requestAnimationFrame(() => document.getElementById(`f-${Object.keys(body.errors)[0]}`)?.focus())
        return
      }
      setStatus({ state: 'failed', code: body.code || (res.status === 413 ? 'too_large' : 'server'), message: body.error })
    } catch {
      setStatus({ state: 'failed', code: 'network' })
    }
  }

  const today = useMemo(() => signingDate(new Date(now)), [now])

  if (status.state === 'sent') {
    return (
      <div>
        <Banner />
        <section className="container-page py-16">
          <div className="max-w-2xl rounded-lg border border-gold/50 bg-plum/50 p-8">
            <p className="eyebrow">Application sent</p>
            <h2 className="mt-3 font-display text-4xl font-semibold">Thank you, {a.student.first.trim()}.</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink/85">
              Your application, essay and photo were sent to the Eta Omicron Chapter. Your reference number is{' '}
              <strong className="text-gold-light">{status.ref}</strong>.
            </p>
            <p className="mt-3 text-lg leading-relaxed text-ink/85">
              {status.copySent
                ? `A copy of your signed forms was emailed to ${a.student.email.trim()}${minor && a.parent.email ? ` and ${a.parent.email.trim()}` : ''}. Keep it with a copy of your essay and photo.`
                : `We couldn’t email you a copy this time, but your application was received. Keep a copy of your essay and photo for your records.`}
            </p>
            <p className="mt-3 text-ink/70">Questions? Write to {c.submitEmail}.</p>
            <Link to="/essay-contest" {...intent('/essay-contest')} className="mt-6 inline-block font-semibold text-gold-light hover:text-gold">
              ← Back to the contest page
            </Link>
          </div>
        </section>
      </div>
    )
  }

  if (!open) {
    return (
      <div>
        <Banner />
        <section className="container-page py-16">
          <p className="max-w-2xl rounded-lg border border-gold/40 bg-plum/50 p-6 text-lg text-ink/85">
            Online applications for the {c.year} contest are closed. See the{' '}
            <Link to="/essay-contest" className="font-semibold text-gold-light underline underline-offset-2">
              contest page
            </Link>{' '}
            for details.
          </p>
        </section>
      </div>
    )
  }

  return (
    <div>
      <Banner />

      <form onSubmit={submit} noValidate className="container-page py-14 max-w-4xl">
        <p className="text-lg leading-relaxed text-ink/80">
          Fill in the forms below, attach your essay and photo, sign, and press <strong>Submit application</strong>. It
          goes straight to the Eta Omicron Chapter at {c.submitEmail}, on the official application forms, and you get
          a copy by email. Have your essay (Word file) and photo ready; it takes about 10 minutes. Deadline:{' '}
          <strong>{c.deadlineText}</strong>.
        </p>
        <p className="mt-3 text-ink/65">
          Prefer paper forms?{' '}
          <a href={c.pdf} download className="font-semibold text-gold-light underline underline-offset-2">
            Download the application
          </a>{' '}
          and email it instead.
        </p>

        {/* Bots fill every field; people never see this one. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" value={a.website} onChange={(e) => set('website', e.target.value)} />
          </label>
        </div>

        <Step n={1} title="About you">
          <div className="grid gap-4 sm:grid-cols-2">
            {field('student.first', 'First name', { autoComplete: 'given-name' })}
            {field('student.last', 'Last name', { autoComplete: 'family-name' })}
            {field('student.email', 'Email', { type: 'email', autoComplete: 'email' })}
            {field('student.age', 'Age', { inputMode: 'numeric', maxLength: 2, hint: 'Your age today, in years.' })}
            {field('student.cellPhone', 'Cell phone', { type: 'tel', autoComplete: 'tel' })}
            {field('student.homePhone', 'Home phone (optional)', { type: 'tel' })}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-[2fr_1.2fr_0.6fr_0.8fr]">
            {field('student.street', 'Street address', { autoComplete: 'address-line1' })}
            {field('student.city', 'City', { autoComplete: 'address-level2' })}
            {field('student.state', 'State', { autoComplete: 'address-level1', maxLength: 20 })}
            {field('student.zip', 'ZIP', { autoComplete: 'postal-code', inputMode: 'numeric', maxLength: 10 })}
          </div>
        </Step>

        <Step n={2} title="Your high school">
          {field('school.name', 'High school name')}
          <div className="mt-4 grid gap-4 sm:grid-cols-[2fr_1.2fr_0.6fr_0.8fr]">
            {field('school.street', 'School street address')}
            {field('school.city', 'City')}
            {field('school.state', 'State', { maxLength: 20 })}
            {field('school.zip', 'ZIP', { inputMode: 'numeric', maxLength: 10 })}
          </div>
          <Check
            id="f-consents.eligibility"
            checked={a.consents.eligibility}
            onChange={(v) => set('consents.eligibility', v)}
            error={errors['consents.eligibility']}
          >
            I am a college-bound high school senior in a public, private or qualifying home-school program, Eta Omicron
            is the closest chapter to my high school, and this is my only application to any chapter.
          </Check>
        </Step>

        {showParent && (
          <Step
            n={3}
            title="Parent or guardian"
            note={minor ? 'Required because you are under 18.' : 'Required if you are under 18. Enter your age above first.'}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {field('parent.name', 'Parent or guardian full name')}
              {field('parent.email', 'Parent or guardian email', { type: 'email', hint: 'They get a copy of the signed forms.' })}
              {field('parent.cellPhone', 'Cell phone', { type: 'tel' })}
              {field('parent.homePhone', 'Home phone (optional)', { type: 'tel' })}
            </div>
          </Step>
        )}

        <Step n={showParent ? 4 : 3} title="Your essay and photo">
          {field('essay.title', 'Essay title', { maxLength: LIMITS.title })}
          <p className="mt-3 text-sm text-ink/65">Topic: {c.topic}</p>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <FilePick
              id="f-essay.file"
              label="Essay (Word file: .doc or .docx)"
              accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onPick={pickEssay}
              chosen={a.essay.file?.name}
              note={fileNotes.essay}
              error={errors['essay.file']}
            />
            <FilePick
              id="f-photo"
              label="Photo: clear, color, head-and-shoulders, taken in the last 6 months"
              accept="image/jpeg,image/png,image/*"
              onPick={pickPhoto}
              chosen={a.photo?.name}
              note={fileNotes.photo}
              error={errors['photo']}
              preview={fileNotes.photoUrl}
            />
          </div>
        </Step>

        <Step n={showParent ? 5 : 4} title="Essay Release Form">
          <Release paragraphs={ESSAY_RELEASE} />
          <Check id="f-consents.essayRelease" checked={a.consents.essayRelease} onChange={(v) => set('consents.essayRelease', v)} error={errors['consents.essayRelease']}>
            {minor
              ? 'As the parent or guardian, I have read and agree to the Essay Release Form.'
              : 'I have read and agree to the Essay Release Form.'}
          </Check>
        </Step>

        <Step n={showParent ? 6 : 5} title="Media Release & Consent Form">
          <Release paragraphs={MEDIA_RELEASE} />
          <Check id="f-consents.mediaRelease" checked={a.consents.mediaRelease} onChange={(v) => set('consents.mediaRelease', v)} error={errors['consents.mediaRelease']}>
            {minor
              ? 'We (student and parent or guardian) have read and agree to the Media Release & Consent Form.'
              : 'I have read and agree to the Media Release & Consent Form.'}
          </Check>
        </Step>

        <Step n={showParent ? 7 : 6} title="Submission checklist">
          <div id="f-consents.checklist" tabIndex={-1} className="space-y-2 outline-none">
            {CHECKLIST.map((item, i) => (
              <label key={item} className="flex cursor-pointer gap-3 rounded-lg border border-ink/10 bg-plum/40 p-3.5 leading-snug has-[:checked]:border-gold/50">
                <input
                  type="checkbox"
                  checked={a.consents.checklist[i]}
                  onChange={(e) => set(`consents.checklist.${i}`, e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#cfae5a]"
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => set('consents.checklist', CHECKLIST.map(() => true))}
            className="mt-3 text-sm font-semibold text-gold-light hover:text-gold"
          >
            I’ve checked every item; tick them all
          </button>
          {errors['consents.checklist'] && <p className="mt-2 text-sm text-[#ffb4a8]">{errors['consents.checklist']}</p>}
        </Step>

        <Step n={showParent ? 8 : 7} title="Sign">
          <p className="mb-5 leading-relaxed text-ink/75">
            {minor
              ? 'Your signature goes on the Media Release and the Submission Checklist. Your parent or guardian’s signature goes on the Essay Release and the Media Release.'
              : 'Your signature goes on the Essay Release, the Media Release and the Submission Checklist.'}{' '}
            Type
            your full name, and draw your signature if you can (if you don’t draw one, your typed name is used).
            Signing date: {today}.
          </p>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-3">
              {field('signatures.student.typed', 'Student: type your full name to sign', { autoComplete: 'name' })}
              <SignaturePad id="sig-student" label="Student signature" onChange={(img) => set('signatures.student.image', img)} />
            </div>
            {minor && (
              <div className="space-y-3">
                {field('signatures.parent.typed', 'Parent or guardian: type your full name to sign')}
                <SignaturePad id="sig-parent" label="Parent or guardian signature" onChange={(img) => set('signatures.parent.image', img)} />
              </div>
            )}
          </div>
        </Step>

        <div className="mt-12 border-t border-gold/35 pt-8">
          {Object.keys(errors).length > 0 && (
            <p role="alert" className="mb-5 rounded-lg border border-[#ffb4a8]/50 bg-[#ffb4a8]/10 p-4 text-[#ffd2ca]">
              Some answers need attention ({Object.keys(errors).length}). They’re marked above.
            </p>
          )}
          {status.state === 'failed' && <SendFailure status={status} />}
          <button
            type="submit"
            disabled={status.state === 'sending'}
            data-track="essay contest: submit application"
            className="rounded-full bg-gold px-8 py-4 text-lg font-semibold text-night hover:bg-gold-light disabled:opacity-60"
          >
            {status.state === 'sending' ? 'Sending…' : 'Submit application'}
          </button>
          <p className="mt-3 text-sm text-ink/60">
            By submitting, you confirm the information is true and that the signatures above are yours (and your parent or
            guardian’s). Your application is emailed to the chapter; it isn’t stored on this website.
          </p>
        </div>
      </form>
    </div>
  )
}

function Banner() {
  return (
    <PageBanner
      breadcrumb={[
        { label: 'Home', to: '/' },
        { label: 'Essay Contest', to: '/essay-contest' },
        { label: 'Apply online' },
      ]}
      title="Apply online"
      subtitle={`${c.year} International High School Essay Contest application, sent to the Eta Omicron Chapter.`}
    />
  )
}

function Step({ n, title, note, children }) {
  return (
    <fieldset className="mt-14">
      <legend className="flex items-baseline gap-4">
        <span className="font-display text-4xl text-gold">{n}</span>
        <span className="font-display text-3xl font-semibold">{title}</span>
      </legend>
      {note && <p className="mt-2 text-ink/65">{note}</p>}
      <div className="mt-5">{children}</div>
    </fieldset>
  )
}

function Field({ id, label, value, onChange, error, hint, type = 'text', ...rest }) {
  return (
    <label className="block">
      <span className="text-sm text-ink/75">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        className={`mt-1.5 block w-full rounded-lg border bg-night/60 px-3.5 py-3 text-ink placeholder:text-ink/35 focus:border-gold-light focus:outline-none ${
          error ? 'border-[#ffb4a8]' : 'border-ink/25'
        }`}
        {...rest}
      />
      {hint && !error && <span className="mt-1 block text-xs text-ink/55">{hint}</span>}
      {error && (
        <span id={`${id}-err`} className="mt-1 block text-sm text-[#ffb4a8]">
          {error}
        </span>
      )}
    </label>
  )
}

function Check({ id, checked, onChange, error, children }) {
  return (
    <div className="mt-5">
      <label className="flex cursor-pointer gap-3 rounded-lg border border-gold/35 bg-plum/50 p-4 leading-snug">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#cfae5a]"
        />
        <span>{children}</span>
      </label>
      {error && <p className="mt-1.5 text-sm text-[#ffb4a8]">{error}</p>}
    </div>
  )
}

function FilePick({ id, label, accept, onPick, chosen, note, error, preview }) {
  return (
    <div>
      <span className="text-sm text-ink/75">{label}</span>
      <label
        className={`mt-1.5 flex cursor-pointer items-center gap-4 rounded-lg border border-dashed p-4 hover:border-gold-light ${
          error ? 'border-[#ffb4a8]' : 'border-ink/30'
        }`}
      >
        {preview ? (
          <img src={preview} alt="" className="h-16 w-16 shrink-0 rounded object-cover" />
        ) : (
          <span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-plum text-2xl text-gold">
            +
          </span>
        )}
        <span className="min-w-0">
          <span className="block font-semibold text-gold-light">{chosen ? 'Choose a different file' : 'Choose file'}</span>
          {chosen && <span className="block truncate text-sm text-ink/70">{chosen}</span>}
        </span>
        <input id={id} type="file" accept={accept} className="sr-only" onChange={(e) => onPick(e.target.files?.[0])} />
      </label>
      {note && <p className={`mt-1.5 text-sm ${note.bad ? 'text-[#ffcf8a]' : 'text-ink/70'}`}>{note.text}</p>}
      {error && <p className="mt-1.5 text-sm text-[#ffb4a8]">{error}</p>}
    </div>
  )
}

function Release({ paragraphs }) {
  return (
    <div className="max-h-72 overflow-y-auto rounded-lg border border-ink/15 bg-night/50 p-5 text-[15px] leading-relaxed text-ink/80 space-y-3" tabIndex={0}>
      {paragraphs.map((t) => (
        <p key={t.slice(0, 40)}>{t}</p>
      ))}
    </div>
  )
}

function SendFailure({ status }) {
  const fallback = (
    <>
      You can also{' '}
      <a href={c.pdf} download className="font-semibold underline underline-offset-2">
        download the application
      </a>
      , fill it in and email it with your essay and photo to {c.submitEmail}.
    </>
  )
  const text =
    status.code === 'not_configured' || status.code === 'mail_auth'
      ? 'Online submission isn’t working right now.'
      : status.code === 'closed'
        ? status.message || 'Applications are closed.'
        : status.code === 'too_large'
          ? 'Your files are too large to send. Try a smaller photo, or remove pictures from the essay.'
          : status.code === 'network'
            ? 'Your application couldn’t be sent. Check your internet connection and press Submit again.'
            : 'Something went wrong sending your application. Please press Submit again.'
  return (
    <p role="alert" className="mb-5 rounded-lg border border-[#ffcf8a]/50 bg-[#ffcf8a]/10 p-4 text-[#ffe3b8]">
      {text} {fallback}
    </p>
  )
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result).split(',')[1])
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

/** Resize a photo to at most 1600px on its long side, as a JPEG, so it uploads quickly. */
async function shrinkPhoto(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close?.()
  for (const q of [0.86, 0.75, 0.6]) {
    const data = canvas.toDataURL('image/jpeg', q).split(',')[1]
    if (data.length * 0.75 <= LIMITS.photoBytes) return data
  }
  throw new Error('photo too large')
}
