import { useEffect, useState } from 'react'
import { getSupabase } from '../context/AuthContext'

// Brothers Only dashboard panels.
//   FinancialStanding: the signed-in brother's dues for this year, from the member app's records
//                      (members + dues_payments). Nothing to enter here; it updates when dues are paid.
//   MeetingMinutes:    the "meeting_minutes" table (Supabase > Table Editor), members only.

const card = 'p-6 rounded-lg border border-ink/10 bg-plum/60'
const APP_URL = 'https://app.etaomicron.org'

function useSupabaseLoad(load, deps) {
  const [state, setState] = useState({ status: 'loading' })
  useEffect(() => {
    let active = true
    getSupabase()
      .then(load)
      .then((data) => active && setState({ status: 'ready', data }))
      .catch((error) => active && setState({ status: 'error', error }))
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}

export function FinancialStanding({ userId }) {
  const year = new Date().getFullYear()
  const state = useSupabaseLoad(async (supabase) => {
    const { data: member, error } = await supabase
      .from('members')
      .select('id,dues_amount')
      .eq('auth_user_id', userId)
      .maybeSingle()
    if (error) throw error
    if (!member) return { member: null }
    const { data: paid, error: payErr } = await supabase
      .from('dues_payments')
      .select('member_id')
      .eq('member_id', member.id)
      .eq('year', year)
      .limit(1)
    if (payErr) throw payErr
    return { member, paid: (paid || []).length > 0 }
  }, [userId, year])

  return (
    <div className={card}>
      <h3 className="font-display text-2xl font-semibold text-ink mb-2">Financial Standing</h3>
      {state.status === 'loading' && <div className="skeleton h-12" />}
      {state.status === 'error' && <p className="text-sm text-ink/70">Couldn&apos;t load your dues right now. Check the member app instead.</p>}
      {state.status === 'ready' && !state.data.member && (
        <p className="text-sm text-ink/70">Your sign-in isn&apos;t linked to a member record yet. Ask the Keeper of Records to add you in the member app.</p>
      )}
      {state.status === 'ready' && state.data.member && (
        <>
          <p className="text-lg">
            {year} dues:{' '}
            {state.data.paid ? (
              <span className="font-semibold text-gold-light">Paid ✓</span>
            ) : (
              <span className="font-semibold">Not paid yet{state.data.member.dues_amount ? ` · $${state.data.member.dues_amount}` : ''}</span>
            )}
          </p>
          <a href={APP_URL} className="mt-3 inline-block text-sm font-semibold text-gold hover:text-gold-light">
            {state.data.paid ? 'View in the member app →' : 'Pay in the member app (Dues tab) →'}
          </a>
        </>
      )}
    </div>
  )
}

export function MeetingMinutes() {
  const state = useSupabaseLoad(async (supabase) => {
    const { data, error } = await supabase
      .from('meeting_minutes')
      .select('id,meeting_date,title,summary,file_url')
      .order('meeting_date', { ascending: false })
      .limit(12)
    if (error) throw error
    return data || []
  }, [])

  return (
    <div className={card}>
      <h3 className="font-display text-2xl font-semibold text-ink mb-2">Meeting Minutes</h3>
      {state.status === 'loading' && <div className="skeleton h-12" />}
      {state.status === 'error' && (
        <p className="text-sm text-ink/70">Minutes aren&apos;t set up yet. (Run the editable content setup SQL in Supabase.)</p>
      )}
      {state.status === 'ready' && state.data.length === 0 && <p className="text-sm text-ink/70">No minutes posted yet.</p>}
      {state.status === 'ready' && state.data.length > 0 && (
        <ul className="divide-y divide-ink/10">
          {state.data.map((m) => (
            <li key={m.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-semibold">{m.title}</p>
                <p className="text-xs text-ink/60 whitespace-nowrap">{formatDate(m.meeting_date)}</p>
              </div>
              {m.summary && <p className="mt-1 text-sm text-ink/75 whitespace-pre-line">{m.summary}</p>}
              {m.file_url && (
                <a href={m.file_url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-sm font-semibold text-gold hover:text-gold-light">
                  Open minutes →
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function formatDate(d) {
  const [y, m, day] = String(d).split('-').map(Number)
  if (!y) return d
  return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
