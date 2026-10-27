import { useState } from 'react';
import { supabase } from './supabaseClient'; // adjust path to your Supabase client

/**
 * PhotoUploadForm
 *
 * Only render this for logged-in admins/officers — check the user's role
 * (e.g. from your `profiles` table) in the parent component before showing
 * this form. The Supabase RLS policies also enforce this server-side, so
 * even if it were shown to someone else, the upload would be rejected.
 *
 * Usage:
 *   <PhotoUploadForm programSlug="stem" onUploaded={() => refetchPhotos()} />
 */

const PROGRAM_OPTIONS = [
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

export default function PhotoUploadForm({ programSlug = '', onUploaded }) {
  const [selectedProgram, setSelectedProgram] = useState(programSlug);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!selectedProgram) {
      setError('Please select a program.');
      return;
    }
    if (!file) {
      setError('Please choose a photo to upload.');
      return;
    }

    setUploading(true);

    try {
      // 1. Upload the file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedProgram}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('program-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 2. Get the public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('program-photos')
        .getPublicUrl(fileName);

      // 3. Insert a row recording the photo
      const { data: userData } = await supabase.auth.getUser();

      const { error: insertError } = await supabase.from('program_photos').insert({
        program_slug: selectedProgram,
        image_url: urlData.publicUrl,
        caption: caption || null,
        event_date: eventDate || null,
        uploaded_by: userData?.user?.id || null,
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setFile(null);
      setCaption('');
      setEventDate('');
      if (onUploaded) onUploaded();
    } catch (err) {
      console.error('Photo upload failed:', err);
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <form className="photo-upload-form" onSubmit={handleSubmit}>
      <h3>Upload event photo</h3>

      <label>
        Program
        <select
          value={selectedProgram}
          onChange={(e) => setSelectedProgram(e.target.value)}
          required
        >
          <option value="">Select a program</option>
          {PROGRAM_OPTIONS.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Photo
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          required
        />
      </label>

      <label>
        Caption (optional)
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="e.g. 2026 STEM Fair at Lincoln Elementary"
        />
      </label>

      <label>
        Event date (optional)
        <input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
      </label>

      {error && <p className="photo-upload-error">{error}</p>}
      {success && <p className="photo-upload-success">Photo uploaded.</p>}

      <button type="submit" disabled={uploading}>
        {uploading ? 'Uploading...' : 'Upload photo'}
      </button>
    </form>
  );
}
