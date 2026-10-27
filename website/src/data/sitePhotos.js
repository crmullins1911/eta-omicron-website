// Photos used in the site design. Put the image file in /public/photos/ (or use a Supabase Storage
// URL) and set `src`. Until a photo is set, a styled tile with `fallback` text is shown instead.
// Always fill in `alt` with a short description of the photo for screen readers and search engines.

export const sitePhotos = {
  // Home page photo/video band. For a video: type 'video', src = the .mp4, poster = a still image.
  // For a photo: type 'image', src = the image. caption = the large line of text over it.
  feature: { type: 'image', src: '', poster: '', alt: '', caption: 'Brothers in service.' },
  news: { src: '', alt: '', fallback: 'Chapter News' },
}
