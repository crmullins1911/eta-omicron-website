import { useEffect } from 'react'
import { jsonLdFor, metaFor } from '../seo'

/**
 * Keeps the document head in step with the current page during client-side navigation.
 * (On first load the build step has already written these tags into the static HTML.)
 */
export default function Seo({ path, data, meta: withMeta = true, ld: withLd = true }) {
  const meta = metaFor(path)
  const ldKey = JSON.stringify(data ?? null)

  useEffect(() => {
    if (!withMeta) return
    document.title = meta.title
    setMeta('name', 'description', meta.description)
    setMeta('name', 'robots', meta.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large')
    setMeta('property', 'og:title', meta.title)
    setMeta('property', 'og:description', meta.description)
    setMeta('name', 'twitter:title', meta.title)
    setMeta('name', 'twitter:description', meta.description)
    if (meta.canonical) {
      setMeta('property', 'og:url', meta.canonical)
      setLink('canonical', meta.canonical)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, withMeta])

  useEffect(() => {
    if (!withLd) return
    let ld = document.getElementById('ld-json')
    if (!ld) {
      ld = document.createElement('script')
      ld.type = 'application/ld+json'
      ld.id = 'ld-json'
      document.head.appendChild(ld)
    }
    ld.textContent = JSON.stringify(jsonLdFor(path, data))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ldKey, withLd])

  return null
}

function setMeta(attr, key, value) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', value)
}

function setLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}
