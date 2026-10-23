import { memo, Suspense, use } from 'react'
import { isHydrating } from '../lib/hydration'

/**
 * Progressive hydration for below-the-fold sections.
 *
 * The section's HTML is in the prerendered page, so visitors and search engines see it right away.
 * What gets deferred is the JavaScript work of making it interactive: React leaves the static HTML
 * in place and only hydrates the section when it scrolls within ~300px of the viewport (or the
 * browser goes idle). Plain links inside still work before that, since they are ordinary <a> tags.
 *
 * On client-side navigations (no prerendered HTML) it renders normally with no delay.
 *
 * Usage: <LazyHydrate id="footer" component={Footer} className="..." />
 * The section is passed as a component (not children) and the wrapper is memoized, so a parent
 * re-rendering can't push an update into a section that is still waiting to hydrate. (React would
 * otherwise discard that section's HTML and re-render it from scratch.) The section should read its
 * own data with hooks rather than receive it as props.
 */
function LazyHydrate({ id, as: Tag = 'div', component: Section, ...rest }) {
  return (
    <Suspense fallback={null}>
      <Tag data-hydrate-id={id} {...rest}>
        <Gate id={id} />
        <Section />
      </Tag>
    </Suspense>
  )
}

export default memo(LazyHydrate)

function Gate({ id }) {
  if (typeof window === 'undefined' || !isHydrating()) return null
  use(whenNear(id))
  return null
}

const gates = new Map()

function whenNear(id) {
  if (gates.has(id)) return gates.get(id)

  const el = document.querySelector(`[data-hydrate-id="${id}"]`)
  const promise = new Promise((resolve) => {
    if (!el || !('IntersectionObserver' in window)) return resolve()

    let done = false
    const finish = () => {
      if (done) return
      done = true
      io.disconnect()
      if (idleHandle) cancelIdle(idleHandle)
      resolve()
    }

    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && finish(), {
      rootMargin: '300px 0px',
    })
    io.observe(el)

    // Don't wait forever: hydrate anyway once the main thread has been idle for a while.
    const idleHandle = onIdle(finish, 6000)
  })

  gates.set(id, promise)
  return promise
}

function onIdle(fn, timeout) {
  if ('requestIdleCallback' in window) return { idle: window.requestIdleCallback(fn, { timeout }) }
  return { timer: setTimeout(fn, timeout) }
}

function cancelIdle(h) {
  if (h.idle) window.cancelIdleCallback(h.idle)
  if (h.timer) clearTimeout(h.timer)
}
