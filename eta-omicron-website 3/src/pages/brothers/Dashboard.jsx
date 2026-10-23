import { lazy, Suspense } from 'react'
import PageBanner from '../../components/PageBanner'
import { useAuth } from '../../context/AuthContext'
import LazyMount from '../../components/LazyMount'

const SiteHealth = lazy(() => import('../../components/SiteHealth'))

// This is the landing page for authenticated members. Add sections here
// for financial statements, dues status, meeting minutes, etc. by
// querying whatever Supabase tables app.etaomicron.org already uses
// (e.g. a "financial_records" or "dues" table), since this site shares
// the same Supabase project and member accounts.

export default function Dashboard() {
  const { user, signOut } = useAuth()

  return (
    <div>
      <PageBanner
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Brothers Only' }]} title="Brothers Only" subtitle="Member and financial information for the chapter." />

      <section className="container-page py-14">
        <div className="flex items-center justify-between mb-8">
          <p className="text-ink/75">
            Signed in as <span className="font-semibold">{user?.email}</span>
          </p>
          <button
            onClick={signOut}
            className="px-4 py-2 rounded-md border border-ink/30 text-sm font-semibold hover:border-gold-light hover:text-gold-light"
          >
            Sign Out
          </button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="p-6 rounded-lg border border-ink/10 bg-plum/60">
            <h3 className="font-display text-2xl font-semibold text-ink mb-2">Financial Standing</h3>
            <p className="text-ink/70 text-sm">
              Placeholder &mdash; connect this to the financial data already tracked in
              app.etaomicron.org (dues status, chapter balance, etc.) via a shared Supabase table.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-ink/10 bg-plum/60">
            <h3 className="font-display text-2xl font-semibold text-ink mb-2">Meeting Minutes</h3>
            <p className="text-ink/70 text-sm">
              Placeholder &mdash; list recent meeting minutes and chapter documents here for members only.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <LazyMount minHeight={360}>
            <Suspense fallback={<div className="skeleton h-80" />}>
              <SiteHealth />
            </Suspense>
          </LazyMount>
        </div>

        <p className="mt-8 text-sm text-ink/60">
          For full chapter management (member records, payments, etc.), go to{' '}
          <a href="https://app.etaomicron.org" className="text-ink underline">
            app.etaomicron.org
          </a>
          .
        </p>
      </section>
    </div>
  )
}
