import { Link } from 'react-router-dom'
import LazyHydrate from '../components/LazyHydrate'
import Photo from '../components/Photo'
import Seo from '../components/Seo'
import useCachedQuery from '../hooks/useCachedQuery'
import useNow, { startOfDay, toDate } from '../hooks/useNow'
import { eventsQuery } from '../lib/queries'
import { intent } from '../lib/prefetch'
import { downloadIcs } from '../lib/calendar'
import { eventSlug } from '../seo'
import { sitePhotos } from '../data/sitePhotos'
import useNewsFeed, { formatNewsDate, headlineFor } from '../hooks/useNewsFeed'
import ChapterVisual from '../components/ChapterVisual'

// "Editorial Night" home page.
// Render order on first load:
//   1. Hero: critical, painted from the static HTML immediately.
//   2. Events + news, the chapter photo/video band, then quick links: in the HTML for visitors and search engines,
//      made interactive when scrolled near (LazyHydrate). Events refresh in the background.

function useUpcoming(limit) {
  const { data: events } = useCachedQuery(eventsQuery)
  const now = useNow()
  const today = startOfDay(now)
  return events.filter((e) => toDate(e.date).getTime() >= today).slice(0, limit)
}

export default function Home() {
  const upcoming = useUpcoming(3)

  return (
    <div>
      <Seo path="/" data={{ events: upcoming }} meta={false} />

      {/* Hero */}
      <section className="container-page pt-16 pb-20 md:pt-24 md:pb-24 flex flex-wrap items-center gap-14">
        <div className="flex-[1_1_520px] min-w-0">
          <p className="eyebrow">Eta Omicron Chapter · Omega Psi Phi Fraternity, Inc.</p>
          <h1 className="mt-6 font-display font-semibold text-ink leading-[1.02] tracking-tight text-[clamp(3rem,6.5vw,5.5rem)]">
            Manhood.
            <br />
            Scholarship.
            <br />
            Perseverance.
            <br />
            <em className="text-gold">Uplift.</em>
          </h1>
          <p className="mt-7 max-w-[30rem] text-lg md:text-xl leading-relaxed text-ink/80">
            The brothers of Eta Omicron mentor young men, fund scholars and serve the community we call home.
          </p>
          <div className="mt-8 flex flex-wrap gap-3.5">
            <Link
              to="/events"
              {...intent('/events')}
              data-track="home hero: events"
              className="rounded-full bg-gold px-6 py-3.5 font-semibold text-night hover:bg-gold-light"
            >
              Upcoming events
            </Link>
            <Link
              to="/about"
              {...intent('/about')}
              data-track="home hero: about"
              className="rounded-full border border-ink/45 px-6 py-3.5 font-semibold text-ink hover:border-gold-light hover:text-gold-light"
            >
              Our history
            </Link>
          </div>
        </div>

        <div className="flex-[1_1_380px] flex justify-center">
          {/* Chapter emblem: the largest element on screen, so it loads first. */}
          <img
            src="/brand/eta-omicron-720.webp"
            srcSet="/brand/eta-omicron-360.webp 360w, /brand/eta-omicron-720.webp 720w"
            sizes="(min-width: 768px) 480px, 80vw"
            alt="Mighty Eta Omicron, 1947 — chapter emblem"
            width="720"
            height="666"
            fetchPriority="high"
            decoding="async"
            className="w-full max-w-[480px] h-auto"
          />
        </div>
      </section>

      <LazyHydrate id="home-news" as="section" className="border-y border-gold/35" data-track-section="home-news" component={EventsAndNews} />

      <LazyHydrate id="home-visual" as="section" className="container-page pt-20" data-track-section="home-visual" component={ChapterVisual} />

      <LazyHydrate id="home-explore" as="section" className="cv-auto" data-track-section="home-explore" component={QuickLinks} />
    </div>
  )
}

function EventsAndNews() {
  const upcoming = useUpcoming(3)
  const latest = useNewsFeed()[0]
  return (
    <div className="container-page py-20 flex flex-wrap gap-14">
      <div className="flex-[999_1_560px] min-w-0">
        <p className="eyebrow">On the calendar</p>
        <h2 className="mt-2 mb-6 font-display text-4xl md:text-[42px] font-semibold">Upcoming events</h2>
        {upcoming.length === 0 ? (
          <p className="text-ink/70 border-t border-ink/15 pt-6">No upcoming events are posted yet. Check back soon.</p>
        ) : (
          <ul>
            {upcoming.map((e, i) => {
              const d = toDate(e.date)
              return (
                <li
                  key={e.title + e.date}
                  className={`flex flex-wrap items-baseline gap-x-6 gap-y-2 py-5 border-t border-ink/15 ${i === upcoming.length - 1 ? 'border-b' : ''}`}
                >
                  <p className="w-28 font-display text-[22px] text-gold">
                    {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <div className="flex-[1_1_260px] min-w-0">
                    <h3 className="text-xl font-semibold">
                      <Link to={`/events#${eventSlug(e)}`} {...intent('/events')} className="hover:text-gold-light">
                        {e.title}
                      </Link>
                    </h3>
                    {(e.time || e.location) && <p className="mt-1 text-ink/70">{[formatTime(e.time), e.location].filter(Boolean).join(' · ')}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadIcs(e)}
                    data-track="home: add to calendar"
                    className="py-2.5 text-gold-light hover:text-gold"
                  >
                    Add to calendar
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <Link to="/events" {...intent('/events')} className="inline-block mt-6 font-semibold text-gold-light hover:text-gold">
          See the full calendar →
        </Link>
      </div>

      <aside className="flex-[1_1_320px]">
        <p className="eyebrow">From the chapter</p>
        <h2 className="mt-2 mb-6 font-display text-4xl md:text-[42px] font-semibold">News</h2>
        {latest?.image ? (
          <img src={latest.image} alt="" loading="lazy" decoding="async" className="h-[200px] w-full rounded object-cover" />
        ) : (
          <Photo photo={sitePhotos.news} className="h-[200px] w-full" />
        )}
        {latest ? (
          <>
            <h3 className="mt-5 font-display text-[26px] font-semibold leading-tight">
              <Link to={`/news#${latest.slug}`} {...intent('/news')} className="hover:text-gold-light">
                {headlineFor(latest)}
              </Link>
            </h3>
            {latest.date && <p className="mt-1 text-sm text-ink/60">{formatNewsDate(latest, { month: 'long', day: 'numeric' })}</p>}
            {latest.summary && <p className="mt-2 leading-relaxed text-ink/75">{latest.summary}</p>}
          </>
        ) : (
          <p className="mt-5 leading-relaxed text-ink/75">No news has been posted yet.</p>
        )}
        <Link to="/news" {...intent('/news')} className="inline-block mt-4 font-semibold text-gold-light hover:text-gold">
          All news →
        </Link>
      </aside>
    </div>
  )
}

const quickLinks = [
  {
    to: '/about#history',
    page: '/about',
    eyebrow: 'Since 1947',
    title: 'About & History',
    text: 'Who we are, where we come from and the principles that guide us.',
  },
  {
    to: '/about#leadership',
    page: '/about',
    eyebrow: 'Leadership',
    title: 'Executive Committee',
    text: 'Meet the officers who lead the chapter this year.',
  },
  {
    to: '/news',
    page: '/news',
    eyebrow: 'Updates',
    title: 'News & Blog',
    text: 'Announcements, stories and recaps from chapter events.',
  },
  {
    to: '/chapter-house',
    page: '/chapter-house',
    eyebrow: 'Visit',
    title: 'Chapter House',
    text: 'Location, hours, meetings and how to reach us.',
  },
]

function QuickLinks() {
  return (
    <div className="container-page py-20">
      <p className="eyebrow">Explore the chapter</p>
      <h2 className="mt-2 mb-8 font-display text-4xl md:text-[42px] font-semibold">Find your way</h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickLinks.map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              {...intent(l.page)}
              data-track={`home quick link: ${l.title}`}
              className="reveal group flex h-full flex-col rounded-lg border border-ink/15 bg-plum/40 p-6 transition-colors hover:border-gold hover:bg-plum/70"
            >
              <span className="eyebrow">{l.eyebrow}</span>
              <span className="mt-3 font-display text-2xl font-semibold text-ink">{l.title}</span>
              <span className="mt-2 flex-1 leading-relaxed text-ink/75">{l.text}</span>
              <span className="mt-5 font-semibold text-gold-light transition-transform group-hover:translate-x-1" aria-hidden="true">
                →
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function formatTime(t) {
  if (!t) return ''
  const m = /^(\d{2}):(\d{2})/.exec(t)
  if (!m) return t
  const h = +m[1]
  return `${((h + 11) % 12) + 1}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`
}
