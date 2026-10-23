import PageBanner from '../components/PageBanner'
import { chapterHouse as h } from '../data/chapterHouse'

// Chapter House info. Details live in src/data/chapterHouse.js; empty fields are hidden.

export default function ChapterHouse() {
  const hasDetails = h.description || h.address || h.hours?.length || h.meetings || h.rentals

  return (
    <div>
      <PageBanner
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'Chapter House' }]}
        title="Chapter House"
        subtitle="Where the brothers of Eta Omicron meet, plan and serve."
      />

      <section className="container-page py-14 flex flex-wrap gap-12">
        <div className="flex-[2_1_480px] min-w-0 space-y-8">
          {h.description && <p className="text-xl leading-relaxed text-ink/85">{h.description}</p>}

          {!hasDetails && (
            <p className="text-xl leading-relaxed text-ink/85">
              Details about the Chapter House are coming soon. In the meantime, reach out and we&apos;ll be glad to help.
            </p>
          )}

          {h.meetings && (
            <div>
              <p className="eyebrow">Chapter meetings</p>
              <p className="mt-2 text-lg leading-relaxed text-ink/80">{h.meetings}</p>
            </div>
          )}

          {h.rentals && (
            <div>
              <p className="eyebrow">Using the house</p>
              <p className="mt-2 text-lg leading-relaxed text-ink/80">{h.rentals}</p>
            </div>
          )}
        </div>

        <aside className="flex-[1_1_300px] rounded-lg border border-gold/40 bg-plum/50 p-7 self-start space-y-6">
          {h.address && (
            <div>
              <p className="eyebrow">Address</p>
              <p className="mt-2 text-lg whitespace-pre-line">{h.address}</p>
              {h.mapUrl && (
                <a href={h.mapUrl} target="_blank" rel="noreferrer" className="inline-block mt-2 font-semibold text-gold-light hover:text-gold">
                  Get directions →
                </a>
              )}
            </div>
          )}

          {h.hours?.length > 0 && (
            <div>
              <p className="eyebrow">Hours</p>
              <ul className="mt-2 space-y-1">
                {h.hours.map((row) => (
                  <li key={row.days} className="flex justify-between gap-4">
                    <span className="text-ink/80">{row.days}</span>
                    <span>{row.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="eyebrow">Contact</p>
            <p className="mt-2">
              <a href={`mailto:${h.contactEmail}`} className="text-gold-light hover:text-gold">
                {h.contactEmail}
              </a>
            </p>
            {h.contactPhone && (
              <p className="mt-1">
                <a href={`tel:${h.contactPhone.replace(/[^\d+]/g, '')}`} className="text-gold-light hover:text-gold">
                  {h.contactPhone}
                </a>
              </p>
            )}
          </div>
        </aside>
      </section>
    </div>
  )
}
