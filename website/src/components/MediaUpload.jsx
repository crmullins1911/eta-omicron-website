import { useCallback, useEffect, useRef, useState } from 'react'
import { getSupabase } from '../context/AuthContext'
import { revalidate } from '../lib/cache'
import { mediaQuery } from '../lib/queries'

/**
 * Officers-only photo/video upload for the Media page (Brothers Only dashboard).
 *
 * Files go to the public "media" storage bucket and a row is added to media_items, so they show on
 * the Media page (and photos in the home page strip). The database only accepts this from officers
 * (supabase/migrations/20261028_officer_media_upload.sql); the dashboard also hides the form for
 * everyone else.
 *
 * Photos are resized to at most 2000px and saved as JPEG before upload, so phone photos stay small.
 * Videos upload as-is and must be MP4 (or MOV from an iPhone), 50 MB or less.
 */

const BUCKET = 'media'
const MAX_BYTES = 50 * 1024 * 1024
const MAX_PHOTO_EDGE = 2000
const VIDEO_TYPES = ['video/mp4', 'video/quicktime']
const RECENT = 8

export default function MediaUpload() {
  const [files, setFiles] = useState([])
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState(null) // { kind: 'ok' | 'error' | 'info', text }
  const [recent, setRecent] = useState([])
  const inputRef = useRef(null)

  const loadRecent = useCallback(async () => {
    const supabase = await getSupabase()
    const { data } = await supabase
      .from('media_items')
      .select('title,type,url,storage_path,created_at')
      .order('created_at', { ascending: false })
      .limit(RECENT)
    setRecent(data || [])
  }, [])

  useEffect(() => {
    loadRecent().catch(() => {})
  }, [loadRecent])

  function pick(e) {
    const chosen = Array.from(e.target.files || [])
    setStatus(null)
    const problems = chosen.map(checkFile).filter(Boolean)
    if (problems.length) {
      setFiles([])
      setStatus({ kind: 'error', text: problems[0] })
      e.target.value = ''
      return
    }
    setFiles(chosen)
  }

  async function submit(e) {
    e.preventDefault()
    if (!files.length) return setStatus({ kind: 'error', text: 'Choose at least one photo or video.' })
    if (!title.trim()) return setStatus({ kind: 'error', text: 'Add a caption so people know what they’re looking at.' })

    setBusy(true)
    const supabase = await getSupabase()
    let done = 0
    try {
      for (const original of files) {
        const isVideo = original.type.startsWith('video/')
        setStatus({
          kind: 'info',
          text: `${isVideo ? 'Uploading video' : 'Uploading photo'} ${done + 1} of ${files.length}…${isVideo ? ' Videos can take a minute.' : ''}`,
        })

        const file = isVideo ? original : await shrinkPhoto(original)
        if (file.size > MAX_BYTES) throw new Error(`“${original.name}” is over 50 MB. Export it at 720p or trim it, then try again.`)

        const ext = isVideo ? (original.type === 'video/quicktime' ? 'mov' : 'mp4') : 'jpg'
        const path = `uploads/${new Date().getFullYear()}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

        const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, cacheControl: '31536000' })
        if (upErr) throw friendly(upErr)

        const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
        const caption = files.length > 1 ? `${title.trim()} (${done + 1})` : title.trim()
        const { error: rowErr } = await supabase
          .from('media_items')
          .insert({ title: caption, type: isVideo ? 'video' : 'image', url: pub.publicUrl, storage_path: path })
        if (rowErr) {
          await supabase.storage.from(BUCKET).remove([path]) // don't leave an orphaned file
          throw friendly(rowErr)
        }
        done++
      }
      setStatus({ kind: 'ok', text: `Posted ${done} ${done === 1 ? 'item' : 'items'} to the Media page.` })
      setFiles([])
      setTitle('')
      if (inputRef.current) inputRef.current.value = ''
    } catch (err) {
      setStatus({
        kind: 'error',
        text: `${done ? `${done} uploaded, then it stopped. ` : ''}${err.message || 'Upload failed. Check your connection and try again.'}`,
      })
    } finally {
      setBusy(false)
      revalidate(mediaQuery).catch(() => {})
      loadRecent().catch(() => {})
    }
  }

  async function remove(item) {
    if (!window.confirm(`Remove “${item.title}” from the Media page?`)) return
    const supabase = await getSupabase()
    const { error } = await supabase.from('media_items').delete().eq('url', item.url)
    if (error) return setStatus({ kind: 'error', text: friendly(error).message })
    if (item.storage_path) await supabase.storage.from(BUCKET).remove([item.storage_path])
    setStatus({ kind: 'ok', text: `Removed “${item.title}”.` })
    revalidate(mediaQuery).catch(() => {})
    loadRecent().catch(() => {})
  }

  return (
    <section className="p-6 rounded-lg border border-gold/35 bg-plum/60">
      <h3 className="font-display text-2xl font-semibold text-ink">Add Photos &amp; Videos</h3>
      <p className="text-sm text-ink/70 mb-5">Officers only. Posts go straight to the public Media page.</p>

      <form onSubmit={submit} className="grid gap-4">
        <label className="grid gap-1.5">
          <span className="text-sm font-semibold">Photos or video</span>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/mp4,video/quicktime"
            onChange={pick}
            disabled={busy}
            className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-2 file:font-semibold file:text-night"
          />
          <span className="text-xs text-ink/60">Photos: any phone photo. Video: MP4, 50 MB or less (about 2–4 min at 1080p).</span>
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-semibold">Caption</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            placeholder="e.g. Talent Hunt 2026 Finals"
            disabled={busy}
            className="rounded-md border border-ink/20 bg-night/40 px-3 py-2 text-ink placeholder:text-ink/40"
          />
        </label>

        {files.length > 0 && (
          <p className="text-sm text-ink/75">
            {files.length} selected: {files.map((f) => f.name).join(', ')}
          </p>
        )}

        <div>
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-gold px-6 py-2.5 font-semibold text-night hover:bg-gold-light disabled:opacity-60"
          >
            {busy ? 'Uploading…' : 'Post to Media page'}
          </button>
        </div>

        {status && (
          <p
            role={status.kind === 'error' ? 'alert' : 'status'}
            className={`text-sm ${status.kind === 'error' ? 'text-red-300' : status.kind === 'ok' ? 'text-gold-light' : 'text-ink/75'}`}
          >
            {status.text}
          </p>
        )}
      </form>

      {recent.length > 0 && (
        <div className="mt-6 border-t border-ink/10 pt-4">
          <p className="text-xs uppercase tracking-wide text-ink/60 mb-3">Latest on the Media page</p>
          <ul className="grid gap-2">
            {recent.map((m) => (
              <li key={m.url} className="flex items-center gap-3">
                <div className="h-12 w-16 flex-none overflow-hidden rounded bg-plum">
                  {m.type === 'video' ? (
                    <video src={m.url} preload="metadata" muted className="h-full w-full object-cover" />
                  ) : (
                    <img src={m.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  )}
                </div>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {m.title}
                  {m.type === 'video' && <span className="ml-2 text-xs text-ink/60">video</span>}
                </span>
                <button type="button" onClick={() => remove(m)} className="text-sm text-ink/60 hover:text-red-300">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function checkFile(f) {
  if (f.type.startsWith('image/')) return null
  if (VIDEO_TYPES.includes(f.type)) return f.size > MAX_BYTES ? `“${f.name}” is over 50 MB. Export it at 720p or trim it, then try again.` : null
  if (f.type.startsWith('video/')) return `“${f.name}” isn’t an MP4. Export or convert it to MP4 so it plays on every phone.`
  return `“${f.name}” isn’t a photo or video.`
}

/** Resize to MAX_PHOTO_EDGE and re-encode as JPEG. Keeps the phone's rotation. */
async function shrinkPhoto(file) {
  let bitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error(`Couldn’t read “${file.name}”. If it’s an iPhone HEIC photo, choose it from the Photos library (it converts automatically) or save it as JPG.`)
  }
  const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
  if (!blob) throw new Error(`Couldn’t process “${file.name}”.`)
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
}

function friendly(err) {
  const msg = String(err?.message || err || '')
  if (/row-level security|policy|unauthorized|403/i.test(msg)) {
    return new Error('The database didn’t accept the upload. Make sure the officer upload setup SQL has been run and your account is marked as an officer.')
  }
  if (/bucket not found/i.test(msg)) return new Error('The "media" storage bucket is missing. Run the officer upload setup SQL in Supabase.')
  if (/exceeded|too large|413/i.test(msg)) return new Error('That file is too large. Keep videos at 50 MB or less.')
  return new Error(msg || 'Upload failed.')
}
