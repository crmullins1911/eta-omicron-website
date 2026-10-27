import PageBanner from '../components/PageBanner'
import useNewsFeed, { formatNewsDate } from '../hooks/useNewsFeed'

// Chapter news / blog: posts in src/data/news.js plus feed posts officers share from the member
// app (the "Share to website" button). Newest first.

export default function News() {
  const items = useNewsFeed()

  return (
    <div>
      <PageBanner
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'News' }]}
        title="Chapter News"
        subtitle="Announcements, stories and updates from the Eta Omicron Chapter."
      />

      <section className="container-page py-14">
        {items.length === 0 && <p className="text-ink/70">No news has been posted yet. Check back soon.</p>}

        <div className="max-w-3xl">
          {items.map((item) => (
            <article key={item.slug} id={item.slug} className="reveal scroll-mt-24 py-10 border-t border-ink/15 first:border-t-0 first:pt-0">
              {item.date && (
                <p className="eyebrow">
                  <time dateTime={item.date}>{formatNewsDate(item)}</time>
                </p>
              )}

              {item.title && <h2 className="mt-3 font-display text-3xl md:text-4xl font-semibold leading-tight">{item.title}</h2>}

              {item.image && (
                <img
                  src={item.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="mt-5 w-full max-h-[520px] rounded-lg border border-ink/10 object-cover"
                />
              )}

              {item.body && (
                <div className="mt-5 space-y-4 text-lg leading-relaxed text-ink/80">
                  {item.body
                    .split(/\n\s*\n/)
                    .filter(Boolean)
                    .map((para, i) => (
                      <p key={i}>{para.trim()}</p>
                    ))}
                </div>
              )}

              {item.caption && (
                <p className="mt-5 text-lg leading-relaxed text-ink/85 whitespace-pre-line">{item.caption}</p>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
