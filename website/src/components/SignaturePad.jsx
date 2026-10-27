import { useEffect, useRef, useState } from 'react'

/**
 * Draw-to-sign box (finger, stylus or mouse). Calls onChange(base64Png | null) with the signature
 * trimmed to its ink, on a transparent background, ready to place on the PDF.
 */
export default function SignaturePad({ id, label, onChange }) {
  const canvasRef = useRef(null)
  const state = useRef({ drawing: false, last: null, box: null })
  const [hasInk, setHasInk] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    const fit = () => {
      const r = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      if (canvas.width === Math.round(r.width * dpr)) return
      canvas.width = Math.round(r.width * dpr)
      canvas.height = Math.round(r.height * dpr)
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = 2.6
      ctx.strokeStyle = '#0d1a59'
      state.current.box = null
      setHasInk(false)
      onChange?.(null)
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const point = (e) => {
    const r = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const grow = (pt) => {
    const b = state.current.box || { x0: pt.x, y0: pt.y, x1: pt.x, y1: pt.y }
    state.current.box = { x0: Math.min(b.x0, pt.x), y0: Math.min(b.y0, pt.y), x1: Math.max(b.x1, pt.x), y1: Math.max(b.y1, pt.y) }
  }

  const down = (e) => {
    e.preventDefault()
    canvasRef.current.setPointerCapture(e.pointerId)
    const pt = point(e)
    state.current.drawing = true
    state.current.last = pt
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, 1.2, 0, Math.PI * 2)
    ctx.fillStyle = '#0d1a59'
    ctx.fill()
    grow(pt)
  }
  const move = (e) => {
    if (!state.current.drawing) return
    const pt = point(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(state.current.last.x, state.current.last.y)
    ctx.lineTo(pt.x, pt.y)
    ctx.stroke()
    state.current.last = pt
    grow(pt)
  }
  const up = () => {
    if (!state.current.drawing) return
    state.current.drawing = false
    setHasInk(true)
    onChange?.(exportPng())
  }

  function exportPng() {
    const canvas = canvasRef.current
    const b = state.current.box
    if (!b) return null
    const dpr = canvas.width / canvas.getBoundingClientRect().width
    const pad = 4
    const sx = Math.max(0, (b.x0 - pad) * dpr)
    const sy = Math.max(0, (b.y0 - pad) * dpr)
    const sw = Math.min(canvas.width - sx, (b.x1 - b.x0 + pad * 2) * dpr)
    const sh = Math.min(canvas.height - sy, (b.y1 - b.y0 + pad * 2) * dpr)
    if (sw < 8 || sh < 8) return null
    const out = document.createElement('canvas')
    // Keep the file small: signatures don't need more than ~600px across.
    const scale = Math.min(1, 600 / sw)
    out.width = Math.round(sw * scale)
    out.height = Math.round(sh * scale)
    out.getContext('2d').drawImage(canvas, sx, sy, sw, sh, 0, 0, out.width, out.height)
    return out.toDataURL('image/png').split(',')[1]
  }

  const clear = () => {
    const canvas = canvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    state.current.box = null
    setHasInk(false)
    onChange?.(null)
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span id={`${id}-label`} className="text-sm text-ink/75">{label}</span>
        {hasInk && (
          <button type="button" onClick={clear} className="text-sm font-semibold text-gold-light hover:text-gold">
            Clear
          </button>
        )}
      </div>
      <div className="relative mt-1.5">
        <canvas
          ref={canvasRef}
          aria-labelledby={`${id}-label`}
          role="img"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          className="block h-36 w-full touch-none rounded-lg border border-ink/25 bg-[#fbf9f4] cursor-crosshair"
        />
        {!hasInk && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-[#0d1a59]/40">
            Sign here with your finger or mouse
          </span>
        )}
        <span aria-hidden="true" className="pointer-events-none absolute inset-x-6 bottom-8 border-b border-[#0d1a59]/25" />
      </div>
    </div>
  )
}
