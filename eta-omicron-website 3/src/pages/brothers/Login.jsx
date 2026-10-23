import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import PageBanner from '../../components/PageBanner'
import { useAuth } from '../../context/AuthContext'
import AuthError from '../../components/AuthError'

export default function Login() {
  const { session, signIn, error: authError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/brothers'

  if (session) {
    return <Navigate to="/brothers" replace />
  }

  if (authError) return <AuthError error={authError} />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) {
      setError(error.message)
    } else {
      navigate(from, { replace: true })
    }
  }

  return (
    <div>
      <PageBanner
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Brothers Only' }]}
        title="Brothers Only"
        subtitle="Sign in with your chapter account to access member and financial information."
      />

      <section className="container-page py-14 max-w-md">
        <form onSubmit={handleSubmit} className="bg-plum/60 border border-ink/10 rounded-lg p-6 space-y-4">
          <p className="text-sm text-ink/70">
            Use the same login you use for{' '}
            <a href="https://app.etaomicron.org" className="text-ink underline">
              app.etaomicron.org
            </a>
            .
          </p>

          <div>
            <label className="block text-sm font-semibold mb-1" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-ink/25 bg-night rounded-md text-ink placeholder:text-ink/45 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-ink/25 bg-night rounded-md text-ink placeholder:text-ink/45 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
            />
          </div>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-md bg-gold text-night font-semibold hover:bg-gold-light disabled:opacity-50"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </section>
    </div>
  )
}
