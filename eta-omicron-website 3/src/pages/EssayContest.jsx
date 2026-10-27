import { Link } from 'react-router-dom'
import PageBanner from '../components/PageBanner'
import useNow from '../hooks/useNow'
import { intent } from '../lib/prefetch'
import { essayContest as c } from '../data/essayContest'

// International High School Essay Contest (Achievement Week). All details live in
// src/data/essayContest.js; see the note at the top of that file for updating it each year.

const FIND_A_CHAPTER = 'https://members.oppf.org/OPPMembers/ChapterSearch/ChapterSearch.aspx'

export function contestOpen(now) {
  return now <= new Date(c.deadline).getTime()
}

export function daysLeft(now) {
  return Math.max(0, Math.ceil((new Date(c.deadline).getTime() - now) / 86400000))
}

export default function EssayContest() {
  const now = useNow()
  const open = contestOpen(now)
  const days = daysLeft(now)
  const total = c.scoring.reduce((sum, s) => sum + s.points, 0)

  return (
    <div>
      <PageBanner
        breadcrumb={[
          { label: 'Home', to: '/' },
          { label: 'Committees', to: '/committees' },
          { label: 'Achievement Week', to: '/committees/achievement-week' },
          { label: 'Essay Contest' },
        ]}
        title="High School Essay Contest"
        subtitle={`${c.year} International High School Essay Contest, part of Omega Psi Phi's annual Achievement Week. Open to college-bound high school seniors.`}
      />

      {/* Topic and the essentials */}
      <section className="container-page pt-14">
        <p className="eyebrow">This year&apos;s topic</p>
        <blockquote className="reveal mt-4 max-w-4xl border-l-2 border-gold pl-6 font-display text-3xl md:text-[40px] font-semibold italic leading-tight text-ink">
          {c.topic}
        </blockquote>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Deadline" value={c.deadlineText}>
            {open ? (
              <span className="text-gold-light">{days === 0 ? 'Due today' : days === 1 ? '1 day left' : `${days} days left`}</span>
            ) : (
              <span className="text-ink/60">Closed for {c.year}</span>
            )}
          </Fact>
          <Fact label="Length" value={c.wordCount}>
            Header and footer text don&apos;t count.
          </Fact>
          <Fact label="Top International award" value={c.internationalAwards[0]?.amount}>
            Plus chapter and District awards.
          </Fact>
          <Fact label="Submit by" value="Email only">
            Mailed paper copies are not accepted.
          </Fact>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3.5">
          <a
            href={c.pdf}
            download
            data-track="essay contest: download application"
            className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3.5 font-semibold text-night hover:bg-gold-light"
          >
            <DownloadIcon /> Download the application (PDF, {c.pdfPages} pages)
          </a>
          <a
            href={c.pdf}
            target="_blank"
            rel="noreferrer"
            data-track="essay contest: view application"
            className="rounded-full border border-ink/45 px-6 py-3.5 font-semibold text-ink hover:border-gold-light hover:text-gold-light"
          >
            View it in your browser
          </a>
        </div>

        {!open && (
          <p className="mt-8 max-w-3xl rounded-lg border border-gold/40 bg-plum/50 p-5 text-ink/85">
            Applications for the {c.year} contest have closed. Thank you to every student who entered. Check back
            next fall for the new topic.
          </p>
        )}
      </section>

      {/* How to enter */}
      <section className="container-page pt-20">
        <p className="eyebrow">How to enter</p>
        <h2 className="mt-2 mb-8 font-display text-4xl font-semibold">Five steps</h2>
        <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
          {[
            ['Download the packet', 'It has the rules, the Title Page and both release forms.'],
            ['Write your essay', `${c.wordCount}, answering this year's topic, in your own words.`],
            ['Fill in and sign the forms', 'A parent or guardian signs too if you are under 18.'],
            ['Add your photo', 'A clear, color head-and-shoulders photo from the last six months.'],
            ['Email everything to us', `Send it all to ${c.submitEmail} before ${c.deadlineText.replace(/\.$/, '')}.`],
          ].map(([title, text], i) => (
            <li key={title} className="reveal tilt rounded-lg border border-ink/15 bg-plum/40 p-6">
              <span className="font-display text-4xl text-gold">{i + 1}</span>
              <p className="mt-3 font-display text-xl font-semibold">{title}</p>
              <p className="mt-2 leading-relaxed text-ink/75">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-page pt-20 flex flex-wrap gap-12">
        <div className="flex-[2_1_480px] min-w-0 space-y-14">
          {/* Eligibility */}
          <div>
            <p className="eyebrow">Who can enter</p>
            <h2 className="mt-2 mb-5 font-display text-3xl font-semibold">Eligibility</h2>
            <ul className="space-y-3 text-lg leading-relaxed text-ink/85">
              {c.eligibility.map((e) => (
                <li key={e} className="flex gap-3">
                  <Check /> <span>{e}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-ink/70">
              Not sure Eta Omicron is the right chapter for your school?{' '}
              <a href={FIND_A_CHAPTER} target="_blank" rel="noreferrer" className="font-semibold text-gold-light underline underline-offset-2 hover:text-gold">
                Find the closest chapter
              </a>{' '}
              or email us and we&apos;ll help.
            </p>
          </div>

          {/* Essay requirements */}
          <div>
            <p className="eyebrow">Writing your essay</p>
            <h2 className="mt-2 mb-5 font-display text-3xl font-semibold">Essay requirements</h2>
            <ul className="space-y-3 text-lg leading-relaxed text-ink/85">
              <li className="flex gap-3">
                <Check /> <span>{c.wordCount} (header and footer text don&apos;t count)</span>
              </li>
              {c.formatting.map((f) => (
                <li key={f} className="flex gap-3">
                  <Check /> <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="reveal mt-6 rounded-lg border border-gold/50 bg-plum/50 p-5">
              <p className="eyebrow">AI policy</p>
              <p className="mt-2 leading-relaxed text-ink/85">{c.aiPolicy}</p>
            </div>
          </div>

          {/* Scoring */}
          <div>
            <p className="eyebrow">Judging</p>
            <h2 className="mt-2 mb-5 font-display text-3xl font-semibold">How essays are scored</h2>
            <table className="w-full max-w-xl text-left">
              <tbody>
                {c.scoring.map((s) => (
                  <tr key={s.item} className="border-t border-ink/15">
                    <td className="py-3 pr-4 text-ink/85">{s.item}</td>
                    <td className="py-3 text-right font-display text-xl text-gold">{s.points}</td>
                  </tr>
                ))}
                <tr className="border-t border-gold/50">
                  <td className="py-3 pr-4 font-semibold">Total</td>
                  <td className="py-3 text-right font-display text-xl font-semibold text-gold">{total}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Checklist */}
          <div>
            <p className="eyebrow">Before you send it</p>
            <h2 className="mt-2 mb-2 font-display text-3xl font-semibold">Submission checklist</h2>
            <p className="mb-5 text-ink/70">Tick each item as you go (this is only for you; nothing is saved or sent).</p>
            <ul className="space-y-2">
              {c.checklist.map((item) => (
                <li key={item}>
                  <label className="flex cursor-pointer gap-3 rounded-lg border border-ink/10 bg-plum/40 p-4 text-lg leading-snug has-[:checked]:border-gold/60 has-[:checked]:text-ink/60">
                    <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-[#cfae5a]" />
                    <span>{item}</span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-ink/70">Missing signatures can disqualify an application, so check both release forms before sending.</p>
          </div>
        </div>

        {/* Awards and contact */}
        <aside className="flex-[1_1_300px] self-start space-y-6">
          <div className="reveal rounded-lg border border-gold/40 bg-plum/50 p-7">
            <p className="eyebrow">International awards</p>
            <ul className="mt-4 space-y-2">
              {c.internationalAwards.map((a) => (
                <li key={a.place} className="flex items-baseline justify-between gap-4 border-b border-ink/10 pb-2 last:border-0">
                  <span className="text-ink/85">{a.place}</span>
                  <span className="font-display text-2xl text-gold">{a.amount}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-ink/70">{c.awardsNote}</p>
          </div>

          <div className="reveal rounded-lg border border-ink/15 bg-plum/40 p-7">
            <p className="eyebrow">Send your application to</p>
            <a href={`mailto:${c.submitEmail}?subject=${encodeURIComponent(`${c.year} High School Essay Contest Application`)}`} className="mt-3 block break-all font-display text-2xl text-gold-light hover:text-gold">
              {c.submitEmail}
            </a>
            {c.contactName && <p className="mt-3 text-ink/85">{c.contactName}</p>}
            {c.contactPhone && (
              <a href={`tel:${c.contactPhone.replace(/[^\d+]/g, '')}`} className="mt-1 block text-ink/85 hover:text-gold-light">
                {c.contactPhone}
              </a>
            )}
            <p className="mt-3 text-sm leading-relaxed text-ink/70">
              Deadline: {c.deadlineText.replace(/\.$/, '')}. Late applications can&apos;t be considered.
            </p>
          </div>

          <Link
            to="/committees/achievement-week"
            {...intent('/committees/achievement-week')}
            className="inline-block font-semibold text-gold-light hover:text-gold"
          >
            ← Achievement Week Committee
          </Link>
        </aside>
      </section>

      <div className="pb-6" />
    </div>
  )
}

function Fact({ label, value, children }) {
  return (
    <div className="reveal tilt rounded-lg border border-ink/15 bg-plum/40 p-6">
      <p className="eyebrow">{label}</p>
      <p className="mt-3 font-display text-2xl font-semibold leading-tight">{value}</p>
      <p className="mt-2 text-sm text-ink/70">{children}</p>
    </div>
  )
}

function Check() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-1.5 h-4 w-4 shrink-0 text-gold" fill="currentColor">
      <path d="M7.6 14.2 3.4 10l1.4-1.4 2.8 2.8 7.6-7.6L16.6 5z" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
      <path d="M9 3h2v7.6l2.6-2.6L15 9.4 10 14.4 5 9.4 6.4 8 9 10.6zM4 15h12v2H4z" />
    </svg>
  )
}
