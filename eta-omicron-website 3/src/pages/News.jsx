import PageBanner from '../components/PageBanner'
import { news } from '../data/news'
import { toDate } from '../hooks/useNow'

// Chapter news / blog. Posts live in src/data/news.js.

export default function News() {
  return (
    <div>
      <PageBanner
        breadcrumb={[{ label: 'Home', to: '/' }, { label: 'News' }]}
        title="Chapter News"
        subtitle="Announcements, stories and updates from the Eta Omicron Chapter."
      />

      <section className="container-page py-14">
        {news.length === 0 && <p className="text-ink/70">No news has been posted yet. Check back soon.</p>}

        <div className="max-w-3xl">
          {news.map((post) => (
            <article key={post.slug} id={post.slug} className="reveal scroll-mt-24 py-10 border-t border-ink/15 first:border-t-0 first:pt-0">
              {post.date && (
                <p className="eyebrow">
                  <time dateTime={post.date}>
                    {toDate(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </time>
                </p>
              )}
              <h2 className="mt-3 font-display text-3xl md:text-4xl font-semibold leading-tight">{post.title}</h2>
              <div className="mt-5 space-y-4 text-lg leading-relaxed text-ink/80">
                {post.body
                  .split(/\n\s*\n/)
                  .filter(Boolean)
                  .map((para, i) => (
                    <p key={i}>{para.trim()}</p>
                  ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
