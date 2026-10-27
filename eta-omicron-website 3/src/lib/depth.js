// 3D depth effects (see the "3D depth" section of src/index.css).
//
// Most of the work is CSS. This file does two small things:
//   - Cursor tilt: on devices with a mouse, cards marked .tilt lean toward the pointer. One
//     listener for the whole page; work is done at most once per frame.
//   - Fallback: browsers without CSS scroll-driven animations get a simple fade-up for .reveal
//     sections, triggered by IntersectionObserver.
//
// Both are skipped for visitors whose device is set to reduce motion. State is kept in data-*
// attributes and CSS variables, which React leaves alone when it re-renders.

let started = false

export function initDepth() {
  if (started || typeof window === 'undefined') return
  started = true
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  initTilt()
  if (!window.CSS?.supports?.('animation-timeline: view()')) initRevealFallback()
}

function initTilt() {
  const mouse = window.matchMedia('(hover: hover) and (pointer: fine)')
  let active = null
  let point = null
  let frame = 0

  const reset = (el) => {
    if (!el) return
    for (const p of ['--rx', '--ry', '--gx', '--gy', '--glow']) el.style.removeProperty(p)
    delete el.dataset.tilting
  }

  const apply = () => {
    frame = 0
    if (!active || !point) return
    const r = active.getBoundingClientRect()
    if (!r.width || !r.height) return
    const x = Math.min(1, Math.max(0, (point.x - r.left) / r.width))
    const y = Math.min(1, Math.max(0, (point.y - r.top) / r.height))
    // Big elements lean less, so wide sections don't swing around.
    const max = r.width > 560 ? 2.5 : r.width > 360 ? 5 : 7
    const s = active.style
    s.setProperty('--rx', `${((0.5 - y) * 2 * max).toFixed(2)}deg`)
    s.setProperty('--ry', `${((x - 0.5) * 2 * max).toFixed(2)}deg`)
    s.setProperty('--gx', `${(x * 100).toFixed(1)}%`)
    s.setProperty('--gy', `${(y * 100).toFixed(1)}%`)
    s.setProperty('--glow', '1')
    active.dataset.tilting = ''
  }

  document.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse' || !mouse.matches) return
      const el = e.target instanceof Element ? e.target.closest('.tilt') : null
      if (el !== active) {
        reset(active)
        active = el
      }
      if (!el) return
      point = { x: e.clientX, y: e.clientY }
      if (!frame) frame = requestAnimationFrame(apply)
    },
    { passive: true }
  )

  // Mouse left the window.
  document.addEventListener('pointerout', (e) => {
    if (!e.relatedTarget) {
      reset(active)
      active = null
    }
  })
}

function initRevealFallback() {
  const root = document.documentElement
  const show = (el) => {
    el.dataset.in = ''
    io.unobserve(el)
  }
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && show(e.target)),
    { rootMargin: '0px 0px -8% 0px' }
  )
  const watch = (el) => {
    if ('in' in el.dataset) return
    // Already on screen (or above it): show straight away, so nothing blinks.
    if (el.getBoundingClientRect().top < window.innerHeight) el.dataset.in = ''
    else io.observe(el)
  }
  const scan = (node) => {
    if (!(node instanceof Element)) return
    if (node.classList.contains('reveal')) watch(node)
    node.querySelectorAll('.reveal').forEach(watch)
  }

  scan(document.body)
  root.classList.add('reveal-js')
  // Pages and sections added later (navigation, data arriving).
  new MutationObserver((records) => records.forEach((r) => r.addedNodes.forEach(scan))).observe(document.body, {
    childList: true,
    subtree: true,
  })
}
