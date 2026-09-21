import { Link } from 'react-router-dom'
import { events } from '../data/placeholders'

export default function Home() {
  const upcoming = events.slice(0, 3)

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-omega-purple to-omega-purple-dark text-white">
        <div className="container-page py-20 md:py-28 text-center">
          <p className="uppercase tracking-widest text-omega-gold font-semibold text-sm mb-3">
            Omega Psi Phi Fraternity, Inc.
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-bold max-w-3xl mx-auto">
            Eta Omicron Chapter
          </h1>
          <p className="mt-4 text-white/80 max-w-xl mx-auto">
            Manhood, Scholarship, Perseverance, and Uplift &mdash; serving our community with pride.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/about" className="px-5 py-3 rounded-md bg-omega-gold text-omega-purple-dark font-semibold hover:brightness-95">
              About Our Chapter
            </Link>
            <Link to="/events" className="px-5 py-3 rounded-md border border-white/40 text-white font-semibold hover:bg-white/10">
              View Events
            </Link>
          </div>
        </div>
      </section>

      {/* General info / announcements */}
      <section className="container-page py-14 grid gap-10 md:grid-cols-3">
        <div className="md:col-span-2">
          <h2 className="font-display text-2xl font-bold text-omega-purple mb-4">Chapter News &amp; Announcements</h2>
          <div className="space-y-4">
            <article className="p-5 rounded-lg border border-gray-200 bg-white shadow-sm">
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
          <ul className="space-y-3">
            {upcoming.map((e) => (
              <li key={e.title} className="p-4 rounded-lg bg-omega-purple/5 border border-omega-purple/10">
                <p className="text-xs font-semibold text-omega-gold uppercase">{e.date}</p>
                <p className="font-semibold text-omega-purple">{e.title}</p>
                <p className="text-sm text-gray-500">{e.location}</p>
              </li>
            ))}
          </ul>
          <Link to="/events" className="inline-block mt-4 text-omega-purple font-semibold underline">
            See full calendar &rarr;
          </Link>
        </aside>
      </section>
    </div>
  )
}
