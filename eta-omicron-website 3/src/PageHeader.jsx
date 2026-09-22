import { Link } from 'react-router-dom'; // swap for your router's Link if different

/**
 * PageHeader
 *
 * Purple diagonal-gradient banner with crest logo, top nav, page title,
 * and a breadcrumb trail. Reuse this on every page — pass in the title
 * and breadcrumb trail for that page.
 *
 * Usage:
 *   <PageHeader
 *     title="Essay Contest"
 *     breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Essay Contest' }]}
 *   />
 */

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/about' },
  { label: 'Events', to: '/events' },
  { label: 'Essay Contest', to: '/essay-contest' },
  { label: 'Talent Hunt', to: '/talent-hunt' },
  { label: 'Programs', to: '/programs' },
  { label: 'Media', to: '/media' },
  { label: 'Brothers Only', to: '/brothers-only' },
];

export default function PageHeader({ title, breadcrumb = [], logoSrc = '/crest.png' }) {
  return (
    <header className="site-header">
      <div className="site-header-bar">
        <Link to="/" className="site-header-logo">
          <img src={logoSrc} alt="Chapter crest" />
        </Link>

        <nav className="site-header-nav" aria-label="Main navigation">
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {title && (
        <div className="site-header-title-block">
          <h1>{title}</h1>
          {breadcrumb.length > 0 && (
            <nav className="site-header-breadcrumb" aria-label="Breadcrumb">
              {breadcrumb.map((crumb, i) => (
                <span key={i}>
                  {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span>{crumb.label}</span>}
                  {i < breadcrumb.length - 1 && <span className="breadcrumb-sep"> / </span>}
                </span>
              ))}
            </nav>
          )}
        </div>
      )}
    </header>
  );
}
