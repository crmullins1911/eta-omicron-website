import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageBanner from '../components/PageBanner'
import SignaturePad from '../components/SignaturePad'
import { intent } from '../lib/prefetch'
import { omegaBall as b } from '../data/omegaBall'
import { ROWS, blankAgreement, formatDate, money, scheduledTotal, todayISO, validateAgreement } from '../lib/omegaBallAgreement'

// Online version of the 2026 Omega Ball Table Reservation & Payment Installment Agreement.
// Submitting sends the signed PDF to the chapter and a copy to the Brother (api/omega-ball-submit.js).

const PLANS = [
  { n: 0, label: 'Pay in full', note: `${money(b.tableCost)} at once` },
  { n: 2, label: '2 installments', note: `${money((b.tableCost - b.deposit) / 2)} each` },
  { n: 3, label: '3 installments', note: `${money((b.tableCost - b.deposit) / 3)} each` },
  { n: 4, label: '4 installments', note: `${money((b.tableCost - b.deposit) / 4)} each` },
]

/** Evenly spaced dates from `start` to the deadline (the last one lands on the deadline). */
function spread(start, n) {
  const s = Date.parse(start + 'T12:00:00Z')
  const e = Date.parse(b.deadline + 'T12:00:00Z')
  return Array.from({ length: n }, (_, i) => new Date(s + ((e - s) * (i + 1)) / n).toISOString().slice(0, 10))
}

export default function OmegaBallTable() {
  const [a, setA] = useState(blankAgreement)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ state: 'idle' })
  const [plan, setPlan] = useState(null)
  const today = todayISO()
  const closed = !b.openForm || today > b.deadline

  const set = (path, value) =>
    setA((prev) => {
      const next = structuredClone(prev)
      const keys = path.split('.')
      let o = next
      keys.slice(0, -1).forEach((k) => (o = o[k]))
      o[keys.at(-1)] = value
      return next
    })

  const total = useMemo(() => Math.round(scheduledTotal(a.schedule) * 100) / 100, [a.schedule])
  const remaining = Math.round((b.tableCost - total) * 100) / 100
  const pct = Math.min(100, Math.max(0, (total / b.tableCost) * 100))

  function applyPlan(n) {
    const depositDate = a.schedule.deposit.date || today
    const balance = b.tableCost - b.deposit
    const sched = Object.fromEntries(ROWS.map((r) => [r.key, { date: '', amount: '' }]))
    sched.deposit = { date: depositDate, amount: String(b.deposit) }
    if (n === 0) {
      sched.extra = { date: depositDate, amount: String(balance) }
    } else {
      const dates = spread(depositDate, n)
      const each = Math.floor((balance / n) * 100) / 100
      dates.forEach((d, i) => {
        const amt = i === n - 1 ? Math.round((balance - each * (n - 1)) * 100) / 100 : each
        sched[`i${i + 1}`] = { date: d, amount: String(amt) }
      })
    }
    setPlan(n)
    setA((prev) => ({ ...prev, schedule: sched }))
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !k.startsWith('schedule'))))
  }

  async function submit(e) {
    e.preventDefault()
    const found = validateAgreement(a)
    setErrors(found)
    if (Object.keys(found).length) {
      requestAnimationFrame(() => document.getElementById(`f-${Object.keys(found)[0]}`)?.focus())
      return
    }
    setStatus({ state: 'sending' })
    try {
      const res = await fetch('/api/omega-ball-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(a),
      })
      const body = await res.json().catch(() => ({}))
      if (res.ok && body.ok) {
        setStatus({ state: 'sent', ref: body.ref, copySent: body.copySent })
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      if (res.status === 422 && body.errors) {
        setErrors(body.errors)
        setStatus({ state: 'idle' })
        requestAnimationFrame(() => document.getElementById(`f-${Object.keys(body.errors)[0]}`)?.focus())
        return
      }
      setStatus({ state: 'failed', code: body.code || 'server', message: body.error })
    } catch {
      setStatus({ state: 'failed', code: 'network' })
    }
  }

  if (status.state === 'sent') {
    return (
      <div>
        <Banner />
        <section className="container-page py-16">
          <div className="max-w-2xl rounded-lg border border-gold/50 bg-plum/50 p-8">
            <p className="eyebrow">Agreement sent</p>
            <h2 className="mt-3 font-display text-4xl font-semibold">Thank you, Brother {a.brother.name.trim().split(' ')[0]}.</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink/85">
              Your signed table agreement was sent to the Omega Ball Committee. Your reference number is{' '}
              <strong className="text-gold-light">{status.ref}</strong>.
            </p>
            <p className="mt-3 text-lg leading-relaxed text-ink/85">
              {status.copySent
                ? `A copy with your payment schedule was emailed to ${a.brother.email.trim()}.`
                : 'We couldn’t email you a copy this time, but the chapter received your agreement.'}{' '}
              Your table is secured once your {money(b.deposit)} deposit is received.
            </p>
            <PayHow className="mt-6" />
            <Link to="/brothers" {...intent('/brothers')} className="mt-6 inline-block font-semibold text-gold-light hover:text-gold">
              ← Back to Brothers Only
            </Link>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div>
      <Banner />

      <section className="container-page py-12">
        {/* At a glance */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ['Table of ' + b.seats, money(b.tableCost)],
            ['Deposit to reserve', money(b.deposit)],
            ['Omega Ball', b.eventDateText.replace(', 2026', '')],
            ['Paid in full by', b.deadlineText.replace(', 2026', '')],
          ].map(([k, v]) => (
            <div key={k} className="reveal tilt rounded-lg border border-gold/30 bg-plum/50 p-4">
              <p className="text-xs uppercase tracking-wide text-ink/65">{k}</p>
              <p className="mt-1 font-display text-2xl md:text-3xl font-semibold text-gold-light">{v}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 max-w-3xl text-ink/80 leading-relaxed">
          This agreement is between the Eta Omicron Graduate Chapter Omega Ball Committee and a financial Brother securing a table for the{' '}
          {b.year} Omega Ball on {b.eventDateText}, with the option to pay in installments. Prefer paper?{' '}
          <a href={b.pdf} download className="font-semibold text-gold-light underline underline-offset-2 hover:text-gold">
            Download the agreement (PDF)
          </a>
          .
        </p>

        {closed ? (
          <p className="mt-10 rounded-lg border border-gold/40 bg-plum/50 p-6 text-lg">
            Online table agreements are closed. Contact the Omega Ball Committee at {b.submitEmail}.
          </p>
        ) : (
          <form onSubmit={submit} noValidate className="max-w-3xl">
            <input type="text" name="website" value={a.website} onChange={(e) => set('website', e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

            <Step n="1" title="Your information">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field id="f-brother.name" label="Full name" autoComplete="name" value={a.brother.name} onChange={(v) => set('brother.name', v)} error={errors['brother.name']} />
                </div>
                <Field id="f-brother.phone" label="Telephone number" type="tel" autoComplete="tel" value={a.brother.phone} onChange={(v) => set('brother.phone', v)} error={errors['brother.phone']} />
                <Field id="f-brother.email" label="Email address" type="email" autoComplete="email" value={a.brother.email} onChange={(v) => set('brother.email', v)} error={errors['brother.email']} hint="Your copy of the signed agreement goes here." />
              </div>
            </Step>

            <Step n="2" title="Your payment schedule" note={`Start with the ${money(b.deposit)} deposit, then schedule the remaining ${money(b.tableCost - b.deposit)} by ${b.deadlineText}.`}>
              <p className="text-sm text-ink/70 mb-3">Quick start: pick a plan, then adjust any date or amount.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" role="group" aria-label="Payment plans">
                {PLANS.map((p) => (
                  <button
                    key={p.n}
                    type="button"
                    onClick={() => applyPlan(p.n)}
                    aria-pressed={plan === p.n}
                    className={`tilt rounded-lg border p-3 text-left transition-colors ${plan === p.n ? 'border-gold bg-gold/15' : 'border-ink/20 bg-plum/40 hover:border-gold/60'}`}
                  >
                    <span className="block font-semibold">{p.label}</span>
                    <span className="block text-xs text-ink/65">{p.note}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 space-y-3">
                {ROWS.map((r) => {
                  const row = a.schedule[r.key]
                  const dErr = errors[`schedule.${r.key}.date`]
                  const aErr = errors[`schedule.${r.key}.amount`]
                  const isDeposit = r.key === 'deposit'
                  return (
                    <div key={r.key} className={`rounded-lg border p-3 sm:p-4 ${isDeposit ? 'border-gold/45 bg-plum/50' : 'border-ink/15 bg-plum/25'}`}>
                      <div className="flex flex-wrap items-end gap-3">
                        <p className="w-full sm:w-44 font-semibold sm:pb-3">
                          {r.label}
                          {isDeposit && <span className="block text-xs font-normal text-ink/60">Required</span>}
                        </p>
                        <label className="flex-1 min-w-[150px]">
                          <span className="text-xs text-ink/65">Scheduled date</span>
                          <input
                            id={`f-schedule.${r.key}.date`}
                            type="date"
                            min={today}
                            max={b.deadline}
                            value={row.date}
                            onChange={(e) => {
                              set(`schedule.${r.key}.date`, e.target.value)
                              setPlan(null)
                            }}
                            aria-invalid={dErr ? 'true' : undefined}
                            className={`mt-1 block w-full rounded-lg border bg-night/60 px-3 py-2.5 text-ink [color-scheme:dark] focus:border-gold-light focus:outline-none ${dErr ? 'border-[#ffb4a8]' : 'border-ink/25'}`}
                          />
                        </label>
                        <label className="w-36">
                          <span className="text-xs text-ink/65">Amount</span>
                          <span className="relative mt-1 block">
                            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/50">$</span>
                            <input
                              id={`f-schedule.${r.key}.amount`}
                              inputMode="decimal"
                              value={row.amount}
                              readOnly={isDeposit}
                              onChange={(e) => {
                                set(`schedule.${r.key}.amount`, e.target.value)
                                setPlan(null)
                              }}
                              placeholder="0.00"
                              aria-invalid={aErr ? 'true' : undefined}
                              className={`block w-full rounded-lg border bg-night/60 py-2.5 pl-7 pr-3 text-ink placeholder:text-ink/30 focus:border-gold-light focus:outline-none ${isDeposit ? 'text-ink/80' : ''} ${aErr ? 'border-[#ffb4a8]' : 'border-ink/25'}`}
                            />
                          </span>
                        </label>
                        {!isDeposit && (row.date || row.amount) && (
                          <button
                            type="button"
                            onClick={() => {
                              set(`schedule.${r.key}`, { date: '', amount: '' })
                              setPlan(null)
                            }}
                            className="pb-3 text-sm text-ink/55 hover:text-[#ffb4a8]"
                            aria-label={`Clear ${r.label}`}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      {(dErr || aErr) && <p className="mt-2 text-sm text-[#ffb4a8]">{dErr || aErr}</p>}
                    </div>
                  )
                })}
              </div>

              {/* Running total */}
              <div className="sticky bottom-3 z-10 mt-5 rounded-lg border border-gold/50 bg-night/95 p-4 backdrop-blur" aria-live="polite">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold">
                    Scheduled: <span className="text-gold-light">{money(total)}</span> of {money(b.tableCost)}
                  </p>
                  <p className={`text-sm ${remaining === 0 ? 'text-gold-light' : 'text-ink/70'}`}>
                    {remaining === 0 ? 'Fully scheduled ✓' : remaining > 0 ? `${money(remaining)} left to schedule` : `${money(-remaining)} over the table cost`}
                  </p>
                </div>
                <div className="mt-2.5 h-2 rounded-full bg-ink/10 overflow-hidden">
                  <div className={`h-full rounded-full transition-[width] duration-500 ${remaining < 0 ? 'bg-[#ffb4a8]' : 'bg-gold'}`} style={{ width: `${pct}%` }} />
                </div>
                {errors['schedule.total'] && (
                  <p id="f-schedule.total" tabIndex={-1} className="mt-2 text-sm text-[#ffb4a8]">
                    {errors['schedule.total']}
                  </p>
                )}
              </div>
            </Step>

            <Step n="3" title="How to pay">
              <PayHow />
            </Step>

            <Step n="4" title="Terms & conditions">
              <ol className="space-y-2">
                {b.terms.map(([title, text], i) => (
                  <li key={title}>
                    <details className="group rounded-lg border border-ink/15 bg-plum/30 open:border-gold/40">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-semibold">
                        <span>
                          <span className="text-gold mr-2">{i + 1}.</span>
                          {title}
                        </span>
                        <span aria-hidden="true" className="text-gold transition-transform group-open:rotate-45 text-xl leading-none">+</span>
                      </summary>
                      <p className="px-4 pb-4 text-ink/80 leading-relaxed">{text}</p>
                    </details>
                  </li>
                ))}
              </ol>
              <Check id="f-agree.terms" checked={a.agree.terms} onChange={(v) => set('agree.terms', v)} error={errors['agree.terms']}>
                I have read and agree to the terms and conditions above, and I am a financial Brother of Eta Omicron Graduate Chapter.
              </Check>
            </Step>

            <Step n="5" title="Acknowledgment & signature">
              <p className="rounded-lg border border-gold/40 bg-plum/50 p-5 leading-relaxed text-ink/90">{b.acknowledgment}</p>
              <Check id="f-agree.acknowledgment" checked={a.agree.acknowledgment} onChange={(v) => set('agree.acknowledgment', v)} error={errors['agree.acknowledgment']}>
                I acknowledge and agree.
              </Check>

              <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto]">
                <Field id="f-signature.typed" label="Printed name" value={a.signature.typed} onChange={(v) => set('signature.typed', v)} error={errors['signature.typed']} autoComplete="name" />
                <div>
                  <span className="text-sm text-ink/75">Date</span>
                  <p className="mt-1.5 rounded-lg border border-ink/15 bg-night/40 px-3.5 py-3 text-ink/80">{formatDate(today)}</p>
                </div>
              </div>
              <div className="mt-4" id="f-signature.image" tabIndex={-1}>
                <SignaturePad id="sig-brother" label="Signature" onChange={(img) => set('signature.image', img)} />
                {errors['signature.image'] && <p className="mt-1.5 text-sm text-[#ffb4a8]">{errors['signature.image']}</p>}
              </div>
              <p className="mt-4 text-sm text-ink/60">
                The Keeper of Records and Seal signs the agreement after the chapter receives it. It becomes valid once both have signed and the {money(b.deposit)} deposit is received.
              </p>
            </Step>

            <div className="mt-12">
              {status.state === 'failed' && <SendFailure status={status} />}
              {Object.keys(errors).length > 0 && status.state !== 'failed' && (
                <p role="alert" className="mb-4 text-[#ffb4a8]">Please fix the highlighted answers above.</p>
              )}
              <button
                type="submit"
                disabled={status.state === 'sending'}
                className="w-full sm:w-auto rounded-full bg-gold px-8 py-4 text-lg font-semibold text-night hover:bg-gold-light disabled:opacity-60"
              >
                {status.state === 'sending' ? 'Sending…' : 'Sign & submit agreement'}
              </button>
              <p className="mt-3 text-sm text-ink/60">Sends your signed agreement to {b.submitEmail} and a copy to your email.</p>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

function Banner() {
  return (
    <PageBanner
      breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Brothers Only', to: '/brothers' }, { label: 'Omega Ball Table' }]}
      title={`${b.year} Omega Ball Table Reservation`}
      subtitle="Table reservation & payment installment agreement for financial Brothers."
    />
  )
}

function PayHow({ className = '' }) {
  return (
    <div className={className}>
      <ul className="grid gap-3 sm:grid-cols-3">
        {b.paymentMethods.map(([k, v]) => (
          <li key={k} className="rounded-lg border border-ink/15 bg-plum/40 p-4">
            <p className="text-xs uppercase tracking-wide text-ink/60">{k}</p>
            <p className="mt-1 font-semibold text-gold-light break-words">{v}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-ink/70">
        Identify yourself and note “{b.paymentMemo}” with every payment.
      </p>
    </div>
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
        className={`mt-1.5 block w-full rounded-lg border bg-night/60 px-3.5 py-3 text-ink placeholder:text-ink/35 focus:border-gold-light focus:outline-none ${error ? 'border-[#ffb4a8]' : 'border-ink/25'}`}
        {...rest}
      />
      {hint && !error && <span className="mt-1 block text-xs text-ink/55">{hint}</span>}
      {error && <span className="mt-1 block text-sm text-[#ffb4a8]">{error}</span>}
    </label>
  )
}

function Check({ id, checked, onChange, error, children }) {
  return (
    <div className="mt-5">
      <label className="flex cursor-pointer gap-3 rounded-lg border border-gold/35 bg-plum/50 p-4 leading-snug">
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#cfae5a]" />
        <span>{children}</span>
      </label>
      {error && <p className="mt-1.5 text-sm text-[#ffb4a8]">{error}</p>}
    </div>
  )
}

function SendFailure({ status }) {
  const text =
    status.code === 'not_configured' || status.code === 'mail_auth'
      ? 'Online submission isn’t working right now.'
      : status.code === 'closed'
        ? status.message || 'Online table agreements are closed.'
        : status.code === 'network'
          ? 'Your agreement couldn’t be sent. Check your internet connection and press Submit again.'
          : 'Something went wrong sending your agreement. Please press Submit again.'
  return (
    <p role="alert" className="mb-5 rounded-lg border border-[#ffcf8a]/50 bg-[#ffcf8a]/10 p-4 text-[#ffe3b8]">
      {text} You can also{' '}
      <a href={b.pdf} download className="font-semibold underline underline-offset-2">
        download the agreement
      </a>
      , sign it and email it to {b.submitEmail}.
    </p>
  )
}

