import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient'; // adjust path to your Supabase client
import './ProgramGallery.css';

/**
 * ProgramGallery
 *
 * Fetches and displays photos for one program from the program_photos
 * table. Use `limit` to show a small preview grid (e.g. inside the
 * Programs tab card) or leave it unset for a full gallery (e.g. on that
 * program's own page/section).
 *
 * Usage:
 *   <ProgramGallery programSlug="stem" limit={3} />        // preview
 *   <ProgramGallery programSlug="stem" />                  // full gallery
 */

export default function ProgramGallery({ programSlug, limit }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchPhotos() {
      setLoading(true);
      let query = supabase
        .from('program_photos')
        .select('*')
        .eq('program_slug', programSlug)
        .order('created_at', { ascending: false });

      if (limit) query = query.limit(limit);

      const { data, error } = await query;

      if (!cancelled) {
        if (error) {
          console.error('Error fetching program photos:', error);
        } else {
          setPhotos(data);
        }
        setLoading(false);
      }
    }

    if (programSlug) fetchPhotos();

    return () => {
      cancelled = true;
    };
  }, [programSlug, limit]);

  if (loading) return null; // keep it quiet while loading; swap for a spinner if you prefer
  if (!photos.length) return <p className="program-gallery-empty">No photos yet.</p>;

  return (
    <div className="program-gallery">
      {photos.map((photo) => (
        <figure key={photo.id} className="program-gallery-item">
          <img src={photo.image_url} alt={photo.caption || ''} loading="lazy" />
          {photo.caption && <figcaption>{photo.caption}</figcaption>}
        </figure>
      ))}
    </div>
  );
}
