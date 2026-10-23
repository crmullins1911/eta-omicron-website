import useCachedQuery from './useCachedQuery'
import { appPostsQuery } from '../lib/queries'
import { news as sitePosts } from '../data/news'

/**
 * All chapter news, newest first: posts written for the website (src/data/news.js) plus feed
 * posts officers shared from the member app.
 *
 * Each item: { slug, date, title?, summary?, body?, caption?, image?, source: 'site' | 'app' }
 */
export default function useNewsFeed() {
  const { data: appPosts } = useCachedQuery(appPostsQuery)

  const items = [
    ...sitePosts.map((p) => ({ ...p, source: 'site', sortKey: `${p.date}T00:00:00` })),
    ...appPosts.map((p) => ({ ...p, source: 'app', sortKey: p.createdAt || p.date })),
  ]
  items.sort((a, b) => String(b.sortKey).localeCompare(String(a.sortKey)))
  return items
}

/** "October 23, 2026" in the chapter's time zone, so build and browser agree. */
export function formatNewsDate(item, opts = { month: 'long', day: 'numeric', year: 'numeric' }) {
  if (!item?.date) return ''
  const d = item.createdAt ? new Date(item.createdAt) : new Date(`${item.date}T12:00:00Z`)
  return isNaN(d) ? '' : d.toLocaleDateString('en-US', { ...opts, timeZone: 'America/New_York' })
}

/** A short headline for a feed post that has only a caption. */
export function headlineFor(item) {
  if (item.title) return item.title
  const text = (item.caption || '').trim().split('\n')[0]
  if (!text) return 'From the chapter'
  const sentence = text.match(/^.{1,90}?[.!?](\s|$)/)?.[0]?.trim()
  return sentence || (text.length > 90 ? text.slice(0, 87).trimEnd() + '…' : text)
}
