import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import PageBanner from '../components/PageBanner'
import { founders, founding } from '../data/founders'
import useSiteContent from '../hooks/useSiteContent'
import { intent } from '../lib/prefetch'

// The four founders of Omega Psi Phi. Content lives in src/data/founders.js; portraits come from
// Supabase site_content (founder_<slug>_photo). Pick a founder card (click, tap, or arrow keys) to
// read his story below; the choice is kept in the address (?founder=just) so it can be shared.

const PRINCIPLES = ['Manhood', 'Scholarship', 'Perseverance', 'Uplift']

export default function Founders() {
  const content = useSiteContent()
  const [params, setParams] = useSearchParams()
  const fromUrl = founders.findIndex((f) => f.slug === params.get('founder'))
  const [active, setActive] = useState(fromUrl >= 0 ? fromUrl : 0)
  const cardRefs = useRef([])
  const panelRef = useRef(null)
  const picked = useRef(false)

  const photoFor = (f) => content[`founder_${f.slug}_photo`] || ''

  function select(i, { focus = false, scroll = false } = {}) {
    const n = (i + founders.length) % founders.length
    picked.current = true
    setActive(n)
    setParams((p) => {
      const next = new URLSearchParams(p)
      next.set('founder', founders[n].slug)
      return next
    }, { replace: true, preventScrollReset: true })
    if (focus) cardRefs.current[n]?.focus()
    if (scroll) {
      // On narrow screens the story sits below the cards; bring it into view.
      requestAnimationFrame(() => {
        const el = panelRef.current
        if (el && el.getBoundingClientRect().top > window.innerHeight * 0.6) {
          el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
        }
      })
    }
  }

  // Keep in step if someone uses the browser's back/forward buttons.
  useEffect(() => {
    if (fromUrl >= 0 && fromUrl !== active) setActive(fromUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromUrl])

  function onKeyDown(e, i) {
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }
    if (keys[e.key]) {
      e.preventDefault()
      select(i + keys[e.key], { focus: true })
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      select(e.key === 'Home' ? 0 : founders.length - 1, { focus: true })
    }
  }

  const f = founders[active]

  return (
    <div>
      <PageBanner
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Founders' }]}
        title="Our Founders"
        subtitle="Four men of vision who founded Omega Psi Phi Fraternity, Inc. at Howard University."
      />

      {/* The founding */}
      <section className="container-page py-14 flex flex-wrap gap-x-14 gap-y-10" data-track-section="founders-founding">
        <div className="flex-[3_1_460px] min-w-0">
          <p className="eyebrow">{founding.place}</p>
          <p className="mt-3 font-display text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-none text-ink">
            {founding.date.split(', ')[0]},<br />
            <em className="text-gold">{founding.date.split(', ')[1]}</em>
          </p>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/85">{founding.summary}</p>
          <ul className="mt-7 flex flex-wrap gap-2.5" aria-label="Cardinal Principles">
            {PRINCIPLES.map((p) => (
              <li key={p} className="rounded-full border border-gold/50 px-4 py-1.5 text-sm font-semibold text-gold-light">
                {p}
              </li>
            ))}
          </ul>
        </div>

        <ol className="flex-[2_1_300px] relative border-l border-gold/40 pl-7 space-y-7 self-start" aria-label="Founding milestones">
          {founding.milestones.map((m) => (
            <li key={m.date + m.text} className="reveal relative">
              <span aria-hidden="true" className="absolute -left-[34px] top-1.5 h-3 w-3 rounded-full bg-gold ring-4 ring-night" />
              <p className="eyebrow">{m.date}</p>
              <p className="mt-1.5 text-ink/85 leading-relaxed">{m.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Founder cards */}
      <section className="border-t border-gold/35 bg-plum/30" data-track-section="founders-cards">
        <div className="container-page py-14">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-3xl md:text-4xl font-semibold">Meet the founders</h2>
            <p className="text-sm text-ink/65">Select a founder to read his story.</p>
          </div>

          <div role="tablist" aria-label="Founders" className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {founders.map((x, i) => {
              const selected = i === active
              return (
                <button
                  key={x.slug}
                  ref={(el) => (cardRefs.current[i] = el)}
                  type="button"
                  role="tab"
                  id={`founder-tab-${x.slug}`}
                  aria-selected={selected}
                  aria-controls="founder-panel"
                  tabIndex={selected ? 0 : -1}
                  onClick={() => select(i, { scroll: true })}
                  onKeyDown={(e) => onKeyDown(e, i)}
                  data-track={`founders: ${x.slug}`}
                  className={`reveal tilt group text-left rounded-lg border bg-plum/60 overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold ${
                    selected ? 'border-gold shadow-[0_0_0_1px_rgb(207_174_90/0.6)]' : 'border-ink/10 hover:border-gold/60'
                  }`}
                >
                  <Portrait founder={x} src={photoFor(x)} className="aspect-[4/5] w-full" />
                  <div className="p-4">
                    <p className="font-display text-lg md:text-xl font-semibold leading-tight">{x.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-gold font-semibold">{x.role}</p>
                    <p className="mt-1 text-sm text-ink/60">{x.years}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Selected founder's story */}
          <article
            ref={panelRef}
            id="founder-panel"
            role="tabpanel"
            aria-labelledby={`founder-tab-${f.slug}`}
            tabIndex={-1}
            className="scroll-mt-24 mt-10 rounded-lg border border-gold/40 bg-night/60 p-6 md:p-10"
          >
            <div key={f.slug} className={`flex flex-wrap gap-10 ${picked.current ? 'founder-swap' : ''}`}>
              <div className="flex-[1_1_220px] md:max-w-[300px]">
                <Portrait founder={f} src={photoFor(f)} className="aspect-[4/5] w-full max-md:max-w-[240px] rounded-lg" large />
                <dl className="mt-6 space-y-3 text-sm">
                  {f.facts.map(([k, v]) => (
                    <div key={k}>
                      <dt className="eyebrow !text-[11px]">{k}</dt>
                      <dd className="mt-0.5 text-ink/85">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="flex-[2_1_420px] min-w-0 max-md:order-first">
                <p className="eyebrow">
                  {f.role} · {f.years}
                </p>
                <h3 className="mt-2 font-display text-3xl md:text-5xl font-semibold leading-tight">
                  <span className="text-ink/60 font-normal italic text-2xl md:text-3xl">{f.title} </span>
                  {f.name}
                </h3>
                <p className="mt-3 text-lg italic text-gold-light">{f.tagline}</p>
                <div className="mt-6 space-y-4 text-ink/85 leading-relaxed text-[17px]">
                  {f.bio.map((p) => (
                    <p key={p.slice(0, 32)}>{p}</p>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => select(active - 1)}
                    className="rounded-full border border-ink/30 px-5 py-2.5 text-sm font-semibold hover:border-gold-light hover:text-gold-light"
                  >
                    ← {founders[(active - 1 + founders.length) % founders.length].name}
                  </button>
                  <button
                    type="button"
                    onClick={() => select(active + 1)}
                    className="rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-night hover:bg-gold-light"
                  >
                    {founders[(active + 1) % founders.length].name} →
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="container-page py-14 text-center">
        <p className="font-display text-2xl md:text-3xl italic text-ink/90">Their legacy lives on in every chapter, including ours.</p>
        <Link
          to="/about"
          {...intent('/about')}
          className="mt-6 inline-block rounded-full border border-gold px-6 py-3 font-semibold text-gold hover:bg-gold hover:text-night"
        >
          Eta Omicron’s history →
        </Link>
      </section>
    </div>
  )
}

/** A founder's portrait, or a monogram tile until a photo is added in Supabase. */
function Portrait({ founder, src, className = '', large = false }) {
  if (src) {
    return (
      <img
        src={src}
        alt={`Portrait of ${founder.name}`}
        loading="lazy"
        decoding="async"
        className={`object-cover grayscale-[15%] ${className}`}
      />
    )
  }
  const initials = founder.name
    .split(' ')
    .filter((w) => w.length > 1)
    .map((w) => w[0])
    .join('')
  return (
    <div
      role="img"
      aria-label={`${founder.name} (photo coming soon)`}
      className={`relative flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_35%,rgb(87_52_134),rgb(36_20_56))] ${className}`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-[12%] rounded-full border border-gold/25 shadow-[inset_0_0_40px_rgb(207_174_90/0.08)]"
      />
      <span className={`relative font-display font-semibold italic text-gold/90 ${large ? 'text-7xl' : 'text-4xl sm:text-5xl md:text-6xl'}`}>
        {initials}
      </span>
      <span className="absolute bottom-3 inset-x-0 text-center text-[10px] uppercase tracking-[0.2em] text-ink/45">
        Photo coming soon
      </span>
    </div>
  )
}
