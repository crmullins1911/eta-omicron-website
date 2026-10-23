import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

// Auth is shared with app.etaomicron.org through the same Supabase project.
//
// The supabase-js client is loaded on demand: public pages never download it. It loads the first
// time something calls useAuth() (the Brothers Only pages), or early if the visitor hovers the
// Brothers Only link (route prefetch pulls it in with the page).

const AuthContext = createContext(undefined)

let clientPromise = null
export function getSupabase() {
  if (!clientPromise) clientPromise = import('../lib/supabaseClient').then((m) => m.supabase)
  return clientPromise
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const started = useRef(false)
  const unsubscribe = useRef(null)

  const start = useCallback(() => {
    if (started.current) return
    started.current = true
    getSupabase().then((supabase) => {
      supabase.auth.getSession().then(({ data }) => {
        setSession(data.session)
        setLoading(false)
      })
      const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
        setSession(newSession)
      })
      unsubscribe.current = () => listener.subscription.unsubscribe()
    })
  }, [])

  useEffect(() => () => unsubscribe.current?.(), [])

  const signIn = async (email, password) => (await getSupabase()).auth.signInWithPassword({ email, password })
  const signOut = async () => (await getSupabase()).auth.signOut()

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signIn, signOut, start }}>
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
