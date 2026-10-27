import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import { intent } from '../lib/prefetch'

const links = [
  { to: '/about', label: 'About' },
  { to: '/events', label: 'Events' },
  { to: '/committees', label: 'Committees' },
  { to: '/media', label: 'Media' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  const linkClass = ({ isActive }) =>
    `block px-3 py-2.5 text-[15px] transition-colors ${
      isActive ? 'text-gold-light' : 'text-ink/90 hover:text-gold-light'
    }`

  const brothersClass = ({ isActive }) =>
    `block px-4 py-2 rounded-full border text-[15px] transition-colors ${
      isActive ? 'bg-gold text-night border-gold' : 'border-gold text-gold hover:bg-gold hover:text-night'
    }`

  return (
    <header className="sticky top-0 z-40 bg-night/95 backdrop-blur border-b border-gold/35">
      <nav className="container-page flex items-center justify-between gap-3 py-3.5" aria-label="Main">
        <NavLink to="/" className="flex items-center gap-3.5 text-ink" {...intent('/')}>
          <img
            src="/brand/crest-96.png"
            alt="Omega Psi Phi Fraternity, Inc. crest"
            width="44"
            height="44"
            fetchPriority="high"
            className="h-11 w-11 rounded-full"
          />
          <span className="font-display text-[22px] font-semibold">Eta Omicron</span>
        </NavLink>

        <button
          className="md:hidden text-ink p-2.5"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        </button>

        <ul className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} className={linkClass} {...intent(l.to)}>
                {l.label}
              </NavLink>
            </li>
          ))}
          <li className="ml-2">
            <NavLink to="/brothers" className={brothersClass} {...intent('/brothers')}>
              Brothers Only
            </NavLink>
          </li>
        </ul>
      </nav>

      {open && (
        <ul id="mobile-menu" className="md:hidden border-t border-gold/20 bg-night-deep px-3 py-2">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} className={linkClass} onClick={() => setOpen(false)} {...intent(l.to)}>
                {l.label}
              </NavLink>
            </li>
          ))}
          <li className="py-2 px-3">
            <NavLink to="/brothers" className={brothersClass} onClick={() => setOpen(false)} {...intent('/brothers')}>
              Brothers Only
            </NavLink>
          </li>
        </ul>
      )}
    </header>
  )
}
