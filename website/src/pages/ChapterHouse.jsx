import PageBanner from '../components/PageBanner'
import { chapterHouse } from '../data/chapterHouse'
import useSiteContent from '../hooks/useSiteContent'

// Chapter House info. Edited in Supabase (site_content rows starting "chapter_house_"); anything
// left empty there falls back to src/data/chapterHouse.js, and empty fields are hidden.

/** "Saturdays | 10:00 AM – 2:00 PM" lines → [{ days, time }] */
function parseHours(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [days, ...rest] = line.split('|')
      return { days: days.trim(), time: rest.join('|').trim() }
    })
}

export default function ChapterHouse() {
  const c = useSiteContent()
  const h = {
    description: c.chapter_house_description || chapterHouse.description,
    address: c.chapter_house_address || chapterHouse.address,
    mapUrl: c.chapter_house_map_url || chapterHouse.mapUrl,
    hours: c.chapter_house_hours ? parseHours(c.chapter_house_hours) : chapterHouse.hours,
    meetings: c.chapter_house_meetings || chapterHouse.meetings,
    rentals: c.chapter_house_rentals || chapterHouse.rentals,
    contactEmail: c.chapter_house_email || chapterHouse.contactEmail,
    contactPhone: c.chapter_house_phone || chapterHouse.contactPhone,
  }
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
          {h.description && <p className="text-xl leading-relaxed text-ink/85 whitespace-pre-line">{h.description}</p>}

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

        <aside className="reveal flex-[1_1_300px] rounded-lg border border-gold/40 bg-plum/50 p-7 self-start space-y-6">
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
                {h.hours.map((row, i) => (
                  <li key={i} className="flex justify-between gap-4">
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
