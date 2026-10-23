// Every public data set the site reads, in one place. Pages read these through useCachedQuery,
// and the build step (scripts/prerender.mjs) runs the same fetchers to bake data into the HTML.

import { restSelect } from './rest'
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

/** Queries to bake into the HTML at build time. */
export function prerenderQueries() {
  return [eventsQuery, mediaQuery, ...committees.map((c) => committeeDocsQuery(c.slug))]
}
