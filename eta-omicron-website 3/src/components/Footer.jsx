import { Link } from 'react-router-dom'
import { intent } from '../lib/prefetch'

// Social links: fill these in to show the icons. Empty ones are hidden.
const SOCIAL = {
  instagram: '',
  facebook: '',
}

export default function Footer() {
  return (
    <footer className="mt-24 bg-night-deep border-t border-gold/35" data-track-section="footer">
      <div className="container-page py-14 grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <img
            src="/brand/eta-omicron-360.webp"
            alt=""
            width="96"
            height="89"
            loading="lazy"
            decoding="async"
            className="mb-4 h-[89px] w-24"
          />
          <p className="font-display text-2xl font-semibold text-ink">Eta Omicron Chapter</p>
          <p className="mt-2 text-ink/70">Omega Psi Phi Fraternity, Inc.</p>
          <p className="mt-1 text-ink/70">
            <a href="mailto:info@etaomicron.org" className="hover:text-gold-light">info@etaomicron.org</a>
          </p>
          <p className="mt-5 text-sm text-ink/60">Manhood · Scholarship · Perseverance · Uplift</p>
        </div>

        <div>
          <p className="eyebrow mb-3">Explore</p>
          <ul className="space-y-2 text-ink/85">
            <li><Link to="/about" className="hover:text-gold-light" {...intent('/about')}>About Us</Link></li>
            <li><Link to="/events" className="hover:text-gold-light" {...intent('/events')}>Events</Link></li>
            <li><Link to="/committees" className="hover:text-gold-light" {...intent('/committees')}>Committees</Link></li>
            <li><Link to="/media" className="hover:text-gold-light" {...intent('/media')}>Media</Link></li>
          </ul>
        </div>

        <div>
          <p className="eyebrow mb-3">Members</p>
          <p className="text-ink/75 text-sm leading-relaxed">
            Manage chapter records at{' '}
            <a href="https://app.etaomicron.org" className="text-gold-light underline underline-offset-2">
              app.etaomicron.org
            </a>
          </p>
          <div className="mt-5 flex items-center gap-3">
            {SOCIAL.instagram && (
              <a href={SOCIAL.instagram} aria-label="Instagram" className="h-11 w-11 rounded-full border border-ink/35 flex items-center justify-center text-ink hover:border-gold hover:text-gold">
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" /></svg>
              </a>
            )}
            {SOCIAL.facebook && (
              <a href={SOCIAL.facebook} aria-label="Facebook" className="h-11 w-11 rounded-full border border-ink/35 flex items-center justify-center text-ink hover:border-gold hover:text-gold">
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v6h4v-6h3l1-4h-4V8z" strokeLinejoin="round" /></svg>
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-ink/10 py-5 text-center text-xs text-ink/60">
        &copy; {new Date().getFullYear()} Eta Omicron Chapter of Omega Psi Phi Fraternity, Inc. All rights reserved.
      </div>
    </footer>
  )
}
