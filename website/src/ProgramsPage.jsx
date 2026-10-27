import { useEffect, useState } from 'react'
import PageBanner from '../components/PageBanner'
import ProgramGallery from '../components/ProgramGallery'
import PhotoUploadForm from '../components/PhotoUploadForm'
import { supabase } from '../supabaseClient' // adjust path to your actual Supabase client file

/**
 * ProgramsPage
 *
 * Lists all mandated programs, each with a small photo preview gallery.
 * Officers additionally see an upload form to add new photos, based on
 * the existing members.is_officer flag -- kept in sync with the RLS
 * policies in program_photos_setup.sql.
 */

const PROGRAMS = [
  { slug: 'achievement-week', name: 'Achievement Week' },
  { slug: 'fatherhood-mentoring', name: 'Fatherhood and Mentoring' },
  { slug: 'health-initiatives', name: 'Health Initiatives' },
  { slug: 'memorial-service', name: 'Memorial Service' },
  { slug: 'naacp', name: 'NAACP' },
  { slug: 'reclamation-retention', name: 'Reclamation and Retention' },
  { slug: 'scholarship', name: 'Scholarship' },
  { slug: 'social-action', name: 'Social Action' },
  { slug: 'stem', name: 'STEM' },
  { slug: 'talent-hunt', name: 'Talent Hunt' },
  { slug: 'voter-registration', name: 'Voter Registration' },
  { slug: 'education', name: 'Education' },
  { slug: 'mobilization', name: 'Mobilization' },
]

export default function ProgramsPage() {
  const [isOfficer, setIsOfficer] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    async function checkOfficerStatus() {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) return

      const { data: member } = await supabase
        .from('members')
        .select('is_officer')
        .eq('auth_user_id', user.id)
        .single()

      if (member?.is_officer) {
        setIsOfficer(true)
      }
    }
    checkOfficerStatus()
  }, [])

  return (
    <div>
      <PageBanner
        title="Programs"
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Programs' }]}
      />

      {isOfficer && (
        <div className="container-page pt-10">
          <PhotoUploadForm onUploaded={() => setRefreshKey((k) => k + 1)} />
        </div>
      )}

      <section className="container-page py-14">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PROGRAMS.map((program) => (
            <div
              key={program.slug}
              className="rounded-lg border border-omega-purple/10 border-l-4 border-l-omega-purple bg-white p-5 shadow-sm"
            >
              <h3 className="font-display font-semibold text-omega-purple">{program.name}</h3>
              <ProgramGallery key={refreshKey} programSlug={program.slug} limit={3} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
