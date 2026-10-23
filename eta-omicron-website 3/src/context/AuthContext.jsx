import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

// Auth is shared with app.etaomicron.org through the same Supabase project.
//
// The supabase-js client is loaded on demand: public pages never download it. It loads the first
// time something calls useAuth() (the Brothers Only pages), or early if the visitor hovers the
// Brothers Only link (route prefetch pulls it in with the page).

const AuthContext = createContext(undefined)

let clientPromise = null
export function getSupabase() {
  if (!clientPromise) {
    clientPromise = import('../lib/supabaseClient')
      .then((m) => m.supabase)
      .catch((err) => {
        clientPromise = null // allow a retry
        throw err
      })
  }
  return clientPromise
}

const TIMEOUT_MS = 12000

function withTimeout(promise, ms, message) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      }
    )
  })
}

/** Turn a technical failure into something a brother can act on. */
function describe(err) {
  const msg = String(err?.message || err || '')
  if (msg.includes('MISSING_SUPABASE_CONFIG')) {
    return {
      kind: 'config',
      message: "The website isn't connected to the chapter's member accounts yet (Supabase settings are missing in Vercel).",
    }
  }
  if (/dynamically imported module|Failed to fetch|Importing a module script failed|error loading/i.test(msg)) {
    return { kind: 'stale', message: 'The site was just updated and part of it didn\'t load. Refreshing the page should fix it.' }
  }
  if (/timed out/i.test(msg)) {
    return { kind: 'timeout', message: "The member sign-in service didn't respond. Check your connection and try again." }
  }
  return { kind: 'other', message: msg || 'Something went wrong connecting to member sign-in.' }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const started = useRef(false)
  const unsubscribe = useRef(null)

  const start = useCallback(() => {
    if (started.current) return
    started.current = true
    setError(null)
    setLoading(true)
    withTimeout(getSupabase(), TIMEOUT_MS, 'Loading member sign-in timed out')
      .then((supabase) => {
        unsubscribe.current?.()
        const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
          setSession(newSession)
        })
        unsubscribe.current = () => listener.subscription.unsubscribe()
        return withTimeout(supabase.auth.getSession(), TIMEOUT_MS, 'Checking your sign-in timed out')
      })
      .then(({ data }) => setSession(data.session))
      .catch((err) => {
        console.error('[auth]', err)
        started.current = false // "Try again" can restart
        setError(describe(err))
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => () => unsubscribe.current?.(), [])

  const signIn = async (email, password) => {
    try {
      return await (await getSupabase()).auth.signInWithPassword({ email, password })
    } catch (err) {
      return { error: { message: describe(err).message } }
    }
  }
  const signOut = async () => (await getSupabase()).auth.signOut()

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, error, signIn, signOut, start }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) throw new Error('useAuth must be used within an AuthProvider')
  const { start } = ctx
  useEffect(() => {
    start()
  }, [start])
  return ctx
}
