import { Link } from 'react-router-dom'
import LazyHydrate from '../components/LazyHydrate'
import Seo from '../components/Seo'
import useCachedQuery from '../hooks/useCachedQuery'
import useNow, { startOfDay, toDate } from '../hooks/useNow'
import { eventsQuery } from '../lib/queries'
import { intent } from '../lib/prefetch'
import { eventSlug } from '../seo'

// Render order on first load:
//   1. Hero: critical, painted from the static HTML immediately (it is the largest element on screen).
//   2. News + upcoming events: in the HTML for visitors and search engines; made interactive
//      when scrolled near (LazyHydrate). Events refresh from Supabase in the background.
//   3. Explore section: same, further down the page.

const explore = [
  { to: '/about', title: 'About Us', text: 'Our history, our officers and the principles that guide us.' },
  { to: '/events', title: 'Events', text: 'Chapter meetings, community service and the Talent Hunt.' },
  { to: '/committees', title: 'Committees', text: 'Forms, applications and updates from each committee.' },
  { to: '/media', title: 'Media', text: 'Photos and video from chapter events.' },
]

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
      <section className="bg-gradient-to-br from-omega-purple to-omega-purple-dark text-white">
        <div className="container-page py-20 md:py-28 text-center">
          <p className="uppercase tracking-widest text-omega-gold font-semibold text-sm mb-3">
            Omega Psi Phi Fraternity, Inc.
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold max-w-3xl mx-auto">Eta Omicron Chapter</h1>
          <p className="mt-4 text-white/80 max-w-xl mx-auto">
            Manhood, Scholarship, Perseverance, and Uplift &mdash; serving our community with pride.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/about"
              {...intent('/about')}
              data-track="home hero: about"
              className="px-5 py-3 rounded-md bg-omega-gold text-omega-purple-dark font-semibold hover:brightness-95"
            >
              About Our Chapter
            </Link>
            <Link
              to="/events"
              {...intent('/events')}
              data-track="home hero: events"
              className="px-5 py-3 rounded-md border border-white/40 text-white font-semibold hover:bg-white/10"
            >
              View Events
            </Link>
          </div>
        </div>
      </section>

      <LazyHydrate id="home-news" as="section" className="container-page py-14 grid gap-10 md:grid-cols-3" data-track-section="home-news" component={NewsAndEvents} />

      {/* Explore: internal links keep visitors moving through the site and help search engines crawl it. */}
      <LazyHydrate id="home-explore" as="section" className="cv-auto bg-omega-purple/5 border-y border-omega-purple/10" data-track-section="home-explore" component={Explore} />
    </div>
  )
}

// General info / announcements + upcoming events
function NewsAndEvents() {
  const upcoming = useUpcoming(3)
  return (
    <>
      <div className="md:col-span-2">
        <h2 className="font-display text-2xl font-bold text-omega-purple mb-4">Chapter News &amp; Announcements</h2>
        <div className="space-y-4">
          <article className="reveal p-5 rounded-lg border border-gray-200 bg-white shadow-sm">
            <p className="text-xs text-gray-400 mb-1">Placeholder</p>
            <h3 className="font-semibold text-lg">Welcome to the new Eta Omicron website</h3>
            <p className="text-gray-600 mt-1">
              This space will carry chapter news, announcements, and general information. Replace this
              placeholder with real posts, or connect it to a Supabase "announcements" table to manage
              posts without editing code.
            </p>
          </article>
        </div>
      </div>

      <aside>
        <h2 className="font-display text-2xl font-bold text-omega-purple mb-4">Upcoming Events</h2>
        {upcoming.length === 0 ? (
          <p className="text-gray-500 text-sm">No upcoming events are posted yet.</p>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((e) => (
              <li key={e.title + e.date}>
                <Link
                  to={`/events#${eventSlug(e)}`}
                  {...intent('/events')}
                  className="reveal block p-4 rounded-lg bg-omega-purple/5 border border-omega-purple/10 hover:border-omega-gold transition-colors"
                >
                  <p className="text-xs font-semibold text-omega-gold uppercase">
                    {toDate(e.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="font-semibold text-omega-purple">{e.title}</p>
                  {e.location && <p className="text-sm text-gray-500">{e.location}</p>}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Link to="/events" {...intent('/events')} className="inline-block mt-4 text-omega-purple font-semibold underline">
          See full calendar &rarr;
        </Link>
      </aside>
    </>
  )
}

function Explore() {
  return (
    <div className="container-page py-14">
      <h2 className="font-display text-2xl font-bold text-omega-purple mb-6">Explore the Chapter</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {explore.map((x) => (
          <Link
            key={x.to}
            to={x.to}
            {...intent(x.to)}
            className="reveal group p-5 rounded-lg bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-omega-gold transition"
          >
            <h3 className="font-display text-lg font-bold text-omega-purple">{x.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{x.text}</p>
            <span className="inline-block mt-3 text-sm font-semibold text-omega-purple group-hover:translate-x-0.5 transition-transform">
              Go &rarr;
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
