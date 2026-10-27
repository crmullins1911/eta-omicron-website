// Every public data set the site reads, in one place. Pages read these through useCachedQuery,
// and the build step (scripts/prerender.mjs) runs the same fetchers to bake data into the HTML.

import { restSelect, restSignUrls } from './rest'
import {
  events as placeholderEvents,
  mediaItems as placeholderMedia,
  committees,
} from '../data/placeholders'

const MINUTE = 60 * 1000

// Events: the member app's "events" table, only rows marked on_website = true.
export const eventsQuery = {
  key: 'events:public',
  ttl: 1 * MINUTE, // events change often (from the member app); keep them close to live
  fallback: placeholderEvents,
  fetch: () =>
    restSelect('events', {
      select: 'title,event_date,event_time,location,description',
      on_website: 'eq.true',
      order: 'event_date.asc',
    }).then((rows) =>
      rows.map((e) => ({
        title: e.title,
        date: e.event_date,
        time: e.event_time,
        location: e.location,
        description: e.description,
      }))
    ),
}

// Media: "media_items" table (+ Supabase Storage URLs). An empty table shows placeholders.
export const mediaQuery = {
  key: 'media:public',
  ttl: 5 * MINUTE,
  fallback: placeholderMedia,
  emptyIsFallback: true,
  fetch: () =>
    restSelect('media_items', {
      select: 'title,type,url,created_at',
      order: 'created_at.desc',
    }),
}

// Committee documents: one query per committee page.
export function committeeDocsQuery(slug) {
  return {
    key: `committee-docs:${slug}`,
    ttl: 5 * MINUTE,
    fallback: [],
    fetch: () =>
      restSelect('committee_documents', {
        select: 'title,file_url,category',
        committee_slug: `eq.${slug}`,
      }),
  }
}

// News from the member app: feed posts an officer shared to the website (posts.on_website).
// Photos live in the app's private "feed-photos" bucket, so each gets a signed link.
// If the sharing database update hasn't been run yet, this quietly returns no posts.
export const appPostsQuery = {
  key: 'news:app-posts',
  ttl: 2 * MINUTE,
  fallback: [],
  fetch: async () => {
    const rows = await restSelect('posts', {
      select: 'id,caption,image_url,created_at',
      on_website: 'eq.true',
      order: 'created_at.desc',
      limit: '24',
    })
    const urls = await restSignUrls(
      'feed-photos',
      rows.map((r) => r.image_url).filter(Boolean)
    ).catch(() => ({}))
    return rows.map((r) => ({
      slug: `post-${r.id}`,
      date: String(r.created_at || '').slice(0, 10),
      createdAt: r.created_at,
      caption: r.caption || '',
      image: r.image_url ? urls[r.image_url] || null : null,
    }))
  },
}

/** Queries to bake into the HTML at build time. */
export function prerenderQueries() {
  return [eventsQuery, mediaQuery, appPostsQuery, ...committees.map((c) => committeeDocsQuery(c.slug))]
}
