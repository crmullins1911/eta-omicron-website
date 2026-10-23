import { useAuth } from '../context/AuthContext'

/** Shown instead of an endless "Loading..." when member sign-in can't start. */
export default function AuthError({ error }) {
  const { start } = useAuth()
  return (
    <div className="container-page py-20 max-w-xl">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900" role="alert">
        <h2 className="font-display text-xl font-bold mb-2">Brothers Only is unavailable right now</h2>
        <p>{error.message}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {error.kind === 'stale' ? (
            <button type="button" onClick={() => window.location.reload()} className="px-4 py-2 rounded-md bg-omega-purple text-white font-semibold">
              Refresh page
            </button>
          ) : (
            <button type="button" onClick={start} className="px-4 py-2 rounded-md bg-omega-purple text-white font-semibold">
              Try again
            </button>
          )}
          <a href="https://app.etaomicron.org" className="px-4 py-2 rounded-md border border-amber-300 font-semibold">
            Go to app.etaomicron.org
          </a>
        </div>
      </div>
    </div>
  )
}
