export default function Footer() {
  return (
    <footer className="bg-omega-purple-dark text-white/80 mt-16">
      <div className="container-page py-10 grid gap-8 md:grid-cols-3 text-sm">
        <div>
          <h3 className="text-white font-display text-lg mb-2">Eta Omicron Chapter</h3>
          <p>Omega Psi Phi Fraternity, Inc.</p>
          <p className="mt-2 text-white/60">
            Manhood &middot; Scholarship &middot; Perseverance &middot; Uplift
          </p>
        </div>
        <div>
          <h4 className="text-omega-gold font-semibold mb-2">Quick Links</h4>
          <ul className="space-y-1">
            <li><a href="/about" className="hover:text-white">About Us</a></li>
            <li><a href="/events" className="hover:text-white">Events</a></li>
            <li><a href="/committees" className="hover:text-white">Committees</a></li>
            <li><a href="/media" className="hover:text-white">Media</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-omega-gold font-semibold mb-2">Contact</h4>
          <p>info@etaomicron.org</p>
          <p className="mt-1">
            Chapter members: manage chapter records at{' '}
            <a href="https://app.etaomicron.org" className="underline hover:text-white">
              app.etaomicron.org
            </a>
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        &copy; {new Date().getFullYear()} Eta Omicron Chapter of Omega Psi Phi Fraternity, Inc. All rights reserved.
      </div>
    </footer>
  )
}
