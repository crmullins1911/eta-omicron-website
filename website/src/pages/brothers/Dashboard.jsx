import { lazy, Suspense, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageBanner from '../../components/PageBanner'
import { intent } from '../../lib/prefetch'
import { useAuth, getSupabase } from '../../context/AuthContext'
import LazyMount from '../../components/LazyMount'
import { FinancialStanding, MeetingMinutes } from '../../components/BrothersPanels'

const SiteHealth = lazy(() => import('../../components/SiteHealth'))
const MediaUpload = lazy(() => import('../../components/MediaUpload'))

// Website Health and the photo/video upload form are officers only. The database enforces this too
// (members.is_officer — see supabase/migrations/20261028_site_health_officers_only.sql and
// 20261028_officer_media_upload.sql); this just keeps them off the page for everyone else.
// Any error hides them.
function useIsOfficer(userId) {
  const [isOfficer, setIsOfficer] = useState(false)
  useEffect(() => {
    let active = true
    setIsOfficer(false)
    if (!userId) return
    getSupabase()
      .then((supabase) => supabase.rpc('is_officer'))
      .then(({ data, error }) => active && setIsOfficer(!error && data === true))
      .catch(() => active && setIsOfficer(false))
    return () => {
      active = false
    }
  }, [userId])
  return isOfficer
}

// Landing page for signed-in brothers. Dues come from the member app's records; meeting minutes from
// the "meeting_minutes" table (see src/components/BrothersPanels.jsx). This site shares the same
// Supabase project and member accounts as app.etaomicron.org.

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const isOfficer = useIsOfficer(user?.id)

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

        <Link
          to="/omega-ball/table"
          {...intent('/omega-ball/table')}
          data-track="brothers: omega ball table"
          className="tilt mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gold/50 bg-plum/60 p-6 hover:border-gold"
        >
          <span>
            <span className="eyebrow">Omega Ball · November 14, 2026</span>
            <span className="mt-1 block font-display text-2xl font-semibold text-ink">Reserve a table: sign the installment agreement online</span>
            <span className="mt-1 block text-sm text-ink/70">Table of 8 · $480 · $120 deposit · paid in full by December 15</span>
          </span>
          <span className="rounded-full bg-gold px-5 py-2.5 font-semibold text-night">Start →</span>
        </Link>

        <div className="grid gap-6 sm:grid-cols-2 items-start">
          <FinancialStanding userId={user?.id} />
          <MeetingMinutes />
        </div>

        {isOfficer && (
          <div className="mt-6">
            <Suspense fallback={<div className="skeleton h-64" />}>
              <MediaUpload />
            </Suspense>
          </div>
        )}

        {isOfficer && (
          <div className="mt-6">
            <LazyMount minHeight={360}>
              <Suspense fallback={<div className="skeleton h-80" />}>
                <SiteHealth />
              </Suspense>
            </LazyMount>
          </div>
        )}

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
