import { useAuth } from '../context/AuthContext'

/** Shown instead of an endless "Loading..." when member sign-in can't start. */
export default function AuthError({ error }) {
  const { start } = useAuth()
  return (
    <div className="container-page py-20 max-w-xl">
      <div className="rounded-lg border border-gold/45 bg-plum/60 p-6 text-ink" role="alert">
        <h2 className="font-display text-2xl font-semibold mb-2">Brothers Only is unavailable right now</h2>
        <p>{error.message}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {error.kind === 'stale' ? (
            <button type="button" onClick={() => window.location.reload()} className="px-4 py-2 rounded-md bg-gold text-night font-semibold">
              Refresh page
            </button>
          ) : (
            <button type="button" onClick={start} className="px-4 py-2 rounded-md bg-gold text-night font-semibold">
              Try again
            </button>
          )}
          <a href="https://app.etaomicron.org" className="px-4 py-2 rounded-md border border-ink/30 font-semibold text-ink hover:border-gold-light hover:text-gold-light">
            Go to app.etaomicron.org
          </a>
        </div>
      </div>
    </div>
  )
}
