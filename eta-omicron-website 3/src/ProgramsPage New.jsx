import { useEffect, useState } from 'react';
import PageHeader from './PageHeader';
import ProgramGallery from './ProgramGallery';
import PhotoUploadForm from './PhotoUploadForm';
import { supabase } from './supabaseClient'; // adjust path to your Supabase client
import './PageHeader.css';
import './ProgramsPage.css';

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
];

export default function ProgramsPage() {
  const [isOfficer, setIsOfficer] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function checkOfficerStatus() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      const { data: member } = await supabase
        .from('members')
        .select('is_officer')
        .eq('auth_user_id', user.id)
        .single();

      if (member?.is_officer) {
        setIsOfficer(true);
      }
    }
    checkOfficerStatus();
  }, []);

  return (
    <div>
      <PageHeader
        title="Programs"
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Programs' }]}
      />

      {isOfficer && (
        <section className="programs-admin-upload">
          <PhotoUploadForm onUploaded={() => setRefreshKey((k) => k + 1)} />
        </section>
      )}

      <section className="programs-grid-section">
        <div className="programs-grid">
          {PROGRAMS.map((program) => (
            <div key={program.slug} className="program-card">
              <h3>{program.name}</h3>
              <ProgramGallery key={refreshKey} programSlug={program.slug} limit={3} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
