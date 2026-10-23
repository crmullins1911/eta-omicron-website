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

// "Editorial Night" home page.
// Render order on first load:
//   1. Hero: critical, painted from the static HTML immediately.
//   2. Events + news, then the Talent Hunt feature: in the HTML for visitors and search engines,
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

      <LazyHydrate id="home-feature" as="section" className="cv-auto" data-track-section="home-feature" component={TalentHunt} />
    </div>
  )
}

function EventsAndNews() {
  const upcoming = useUpcoming(3)
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
        <Photo photo={sitePhotos.news} className="h-[200px] w-full" />
        <h3 className="mt-5 font-display text-[26px] font-semibold leading-tight">Welcome to the new Eta Omicron website</h3>
        <p className="mt-2 leading-relaxed text-ink/75">
          Chapter news, announcements and updates will appear here. Brothers can also find member resources in the
          Brothers Only area.
        </p>
      </aside>
    </div>
  )
}

function TalentHunt() {
  return (
    <div className="container-page py-24 flex flex-wrap gap-12">
      <div className="flex-[1_1_320px]">
        <p className="eyebrow">Signature program</p>
        <h2 className="mt-2 font-display text-5xl md:text-[52px] font-semibold leading-[1.05]">
          The Talent
          <br />
          <em className="text-gold">Hunt</em>
        </h2>
      </div>
      <div className="flex-[2_1_520px] min-w-0">
        <p className="text-xl md:text-[21px] leading-relaxed text-ink/85">
          Each year our chapter&apos;s Talent Hunt invites local high school students to compete for scholarships in
          music, dance, spoken word and the visual arts.
        </p>
        <div className="mt-7 flex flex-wrap gap-3.5">
          <Link
            to="/committees/talent-hunt"
            {...intent('/committees/talent-hunt')}
            data-track="home: talent hunt apply"
            className="rounded-full bg-gold px-6 py-3.5 font-semibold text-night hover:bg-gold-light"
          >
            Apply or nominate a student
          </Link>
          <a
            href="mailto:info@etaomicron.org?subject=Sponsoring%20a%20Talent%20Hunt%20scholarship"
            data-track="home: sponsor scholarship"
            className="rounded-full border border-ink/45 px-6 py-3.5 font-semibold text-ink hover:border-gold-light hover:text-gold-light"
          >
            Sponsor a scholarship
          </a>
        </div>
      </div>
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
