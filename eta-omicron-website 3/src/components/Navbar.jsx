import { NavLink } from 'react-router-dom'
import { useState } from 'react'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About Us' },
  { to: '/events', label: 'Events' },
  { to: '/committees', label: 'Committees' },
  { to: '/media', label: 'Media' },
  { to: '/brothers', label: 'Brothers Only' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  const linkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
      isActive
        ? 'bg-omega-gold text-omega-purple-dark'
        : 'text-white/90 hover:bg-white/10 hover:text-white'
    }`

  return (
    <header className="bg-omega-purple sticky top-0 z-40 shadow-lg">
      <nav className="container-page flex items-center justify-between h-16">
        <NavLink to="/" className="flex items-center gap-2 text-white font-display text-lg font-bold">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-omega-gold text-omega-purple-dark font-black">
            ΕΟ
          </span>
          Eta Omicron Chapter
        </NavLink>

        <button
          className="md:hidden text-white p-2"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>

        <ul className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end={l.end} className={linkClass}>
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {open && (
        <ul className="md:hidden bg-omega-purple-dark border-t border-white/10">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end={l.end} className={linkClass} onClick={() => setOpen(false)}>
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </header>
  )
}
