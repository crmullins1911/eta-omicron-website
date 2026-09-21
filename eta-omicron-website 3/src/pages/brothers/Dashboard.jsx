import PageHeader from '../../components/PageHeader'
import { useAuth } from '../../context/AuthContext'

// This is the landing page for authenticated members. Add sections here
// for financial statements, dues status, meeting minutes, etc. by
// querying whatever Supabase tables app.etaomicron.org already uses
// (e.g. a "financial_records" or "dues" table), since this site shares
// the same Supabase project and member accounts.

export default function Dashboard() {
  const { user, signOut } = useAuth()

  return (
    <div>
      <PageHeader title="Brothers Only" subtitle="Member and financial information for the chapter." />

      <section className="container-page py-14">
        <div className="flex items-center justify-between mb-8">
          <p className="text-gray-600">
            Signed in as <span className="font-semibold">{user?.email}</span>
          </p>
          <button
            onClick={signOut}
            className="px-4 py-2 rounded-md border border-gray-300 text-sm font-semibold hover:bg-gray-50"
          >
            Sign Out
          </button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
            <h3 className="font-display text-xl font-bold text-omega-purple mb-2">Financial Standing</h3>
            <p className="text-gray-500 text-sm">
              Placeholder &mdash; connect this to the financial data already tracked in
              app.etaomicron.org (dues status, chapter balance, etc.) via a shared Supabase table.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-gray-200 bg-white shadow-sm">
            <h3 className="font-display text-xl font-bold text-omega-purple mb-2">Meeting Minutes</h3>
            <p className="text-gray-500 text-sm">
              Placeholder &mdash; list recent meeting minutes and chapter documents here for members only.
            </p>
          </div>
        </div>

        <p className="mt-8 text-sm text-gray-400">
          For full chapter management (member records, payments, etc.), go to{' '}
          <a href="https://app.etaomicron.org" className="text-omega-purple underline">
            app.etaomicron.org
          </a>
          .
        </p>
      </section>
    </div>
  )
}
