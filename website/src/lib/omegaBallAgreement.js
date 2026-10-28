// Checks for the Omega Ball table agreement. Shared by the form (src/pages/OmegaBallTable.jsx) and
// the server (api/omega-ball-submit.js) so both apply exactly the same rules.

import { omegaBall as b } from '../data/omegaBall.js'

export const ROWS = [
  { key: 'deposit', label: 'Initial Deposit (25%)' },
  ...Array.from({ length: b.installments }, (_, i) => ({ key: `i${i + 1}`, label: `Installment ${i + 1}` })),
  { key: 'extra', label: 'Additional Payment' },
]

export const LIMITS = { signatureBytes: 120 * 1024 }

export function blankAgreement() {
  return {
    brother: { name: '', phone: '', email: '' },
    schedule: Object.fromEntries(ROWS.map((r) => [r.key, { date: '', amount: r.key === 'deposit' ? String(b.deposit) : '' }])),
    agree: { terms: false, acknowledgment: false },
    signature: { typed: '', image: null },
    website: '', // honeypot
  }
}

export const money = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function amountOf(v) {
  const n = Number(String(v ?? '').replace(/[$,\s]/g, ''))
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN
}

export function scheduledTotal(schedule) {
  return ROWS.reduce((sum, r) => {
    const n = amountOf(schedule?.[r.key]?.amount)
    return sum + (Number.isFinite(n) ? n : 0)
  }, 0)
}

/** Today's date as YYYY-MM-DD in Eastern time. */
export function todayISO(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(now)
}

export function formatDate(iso) {
  const [y, m, d] = String(iso || '').split('-').map(Number)
  if (!y || !m || !d) return ''
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' })
}

/** Returns { fieldPath: message } for anything that needs fixing (empty object = OK). */
export function validateAgreement(a, now = new Date()) {
  const e = {}
  const br = a?.brother || {}
  const name = String(br.name || '').trim()
  if (name.length < 3) e['brother.name'] = 'Enter your full name.'
  const digits = String(br.phone || '').replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 11) e['brother.phone'] = 'Enter a 10-digit phone number.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(br.email || '').trim())) e['brother.email'] = 'Enter a valid email address.'

  const today = todayISO(now)
  for (const r of ROWS) {
    const row = a?.schedule?.[r.key] || {}
    const amt = row.amount === '' || row.amount == null ? null : amountOf(row.amount)
    const date = String(row.date || '')
    const path = `schedule.${r.key}`
    if (r.key === 'deposit') {
      if (amt !== b.deposit) e[`${path}.amount`] = `The initial deposit is ${money(b.deposit)}.`
      if (!date) e[`${path}.date`] = 'Choose the date you will pay the deposit.'
    } else if (amt !== null || date) {
      if (amt === null || !Number.isFinite(amt) || amt <= 0) e[`${path}.amount`] = 'Enter an amount, or clear this row.'
      if (!date) e[`${path}.date`] = 'Choose a date, or clear this row.'
    }
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) e[`${path}.date`] = 'Choose a date.'
    else if (date && date > b.deadline) e[`${path}.date`] = `Payments must be made by ${b.deadlineText}.`
    else if (date && date < today && !e[`${path}.date`]) e[`${path}.date`] = 'Choose today or a later date.'
  }
  const total = Math.round(scheduledTotal(a?.schedule) * 100) / 100
  if (total !== b.tableCost) {
    e['schedule.total'] =
      total < b.tableCost
        ? `Your payments add up to ${money(total)}. Schedule ${money(b.tableCost - total)} more to reach ${money(b.tableCost)}.`
        : `Your payments add up to ${money(total)}, which is ${money(total - b.tableCost)} more than the ${money(b.tableCost)} table cost.`
  }

  if (!a?.agree?.terms) e['agree.terms'] = 'Please confirm you have read and agree to the terms and conditions.'
  if (!a?.agree?.acknowledgment) e['agree.acknowledgment'] = 'Please confirm the acknowledgment.'
  const typed = String(a?.signature?.typed || '').trim()
  if (!typed) e['signature.typed'] = 'Type your full name as your printed name.'
  if (!a?.signature?.image) e['signature.image'] = 'Sign in the box with your finger, stylus or mouse.'
  return e
}
