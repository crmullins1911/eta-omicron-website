import { useEffect, useRef, useState } from 'react'

/**
 * Client-only content (dashboards, widgets) that doesn't need to be in the page's HTML:
 * nothing is rendered or downloaded until it scrolls near the viewport.
 */
export default function LazyMount({ children, minHeight = 200, rootMargin = '400px 0px' }) {
  const ref = useRef(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return setShow(true)
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setShow(true)
        io.disconnect()
      }
    }, { rootMargin })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [rootMargin])

  return <div ref={ref} style={show ? undefined : { minHeight }}>{show ? children : null}</div>
}
