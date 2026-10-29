// Approach radar centred on EBAW. Bearing = direction of the airport the last check ran from,
// range = response time. Blips glow when the sweep passes and fade like phosphor.
import { MouseEvent, useEffect, useRef } from 'react'
import { AIRPORTS, Flight, bearingTo, hashOf } from './fleet'

// Square-root range scale: fast sites still spread out, slow ones stay on the scope
const RINGS_MS = [50, 100, 250, 500]
const MAX_MS = 1000
const SWEEP_MS = 6000
export const GHOST_ID = 'ORN001'
const GHOST = { x: 0.62, y: -0.48 }

type Blip = { id: string; x: number; y: number; a: number; color: string; flight: Flight }

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

export default function Radar({
  flights,
  selected,
  mayday,
  onSelect,
}: {
  flights: Flight[]
  selected: string | null
  mayday: boolean
  onSelect: (id: string | null) => void
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const live = useRef({ flights, selected, mayday })
  live.current = { flights, selected, mayday }
  const blips = useRef<Blip[]>([])
  const size = useRef(0)
  const redraw = useRef<() => void>(() => {})

  useEffect(() => {
    const cv = canvas.current!
    const ctx = cv.getContext('2d')!
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const C = {
      scope: css('--eurth-scope'),
      amber: css('--eurth-amber'),
      bad: css('--eurth-bad'),
      ok: css('--eurth-ok'),
      rule: css('--eurth-rule'),
      dim: css('--eurth-dim'),
      ink: css('--eurth-ink'),
      mono: css('--eurth-mono') || 'monospace',
    }
    let frame = 0

    const resize = () => {
      const w = cv.getBoundingClientRect().width || 300
      const dpr = window.devicePixelRatio || 1
      cv.width = Math.round(w * dpr)
      cv.height = Math.round(w * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      size.current = w / 2
    }

    const draw = (t: number) => {
      const R = size.current
      if (!R) return
      const { flights, selected, mayday } = live.current
      const polar = (a: number, r: number): [number, number] => [R + Math.sin(a) * r, R - Math.cos(a) * r]
      const inner = R * 0.08
      const outer = R * 0.9
      const range = (ms: number) => inner + Math.sqrt(Math.min(ms, MAX_MS) / MAX_MS) * (outer - inner)
      const sweep = reduce ? Math.PI * 0.35 : ((t / SWEEP_MS) % 1) * Math.PI * 2
      const since = (a: number) => {
        const two = Math.PI * 2
        return (((sweep - (((a % two) + two) % two)) % two) + two) % two
      }
      const font = (px: number, weight = 500) => `${weight} ${Math.max(8.5, R * px)}px ${C.mono}`

      ctx.clearRect(0, 0, R * 2, R * 2)
      const bg = ctx.createRadialGradient(R, R, 0, R, R, R)
      bg.addColorStop(0, '#0c2630')
      bg.addColorStop(1, '#06141a')
      ctx.fillStyle = bg
      ctx.beginPath()
      ctx.arc(R, R, R, 0, Math.PI * 2)
      ctx.fill()

      // range rings every 100 ms, compass ticks every 10°, runway-style headings
      ctx.strokeStyle = C.rule
      ctx.lineWidth = 1
      for (const ms of RINGS_MS) {
        ctx.beginPath()
        ctx.arc(R, R, range(ms), 0, Math.PI * 2)
        ctx.stroke()
      }
      for (let d = 0; d < 360; d += 10) {
        const a = (d * Math.PI) / 180
        const [x1, y1] = polar(a, R * (d % 30 ? 0.95 : 0.91))
        const [x2, y2] = polar(a, R * 0.99)
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      }
      ctx.globalAlpha = 0.35
      ctx.beginPath()
      ctx.moveTo(R, R * 0.04)
      ctx.lineTo(R, R * 1.96)
      ctx.moveTo(R * 0.04, R)
      ctx.lineTo(R * 1.96, R)
      ctx.stroke()
      ctx.globalAlpha = 1
      ctx.fillStyle = C.dim
      ctx.font = font(0.05)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ;(
        [
          ['36', 0],
          ['09', 0.25],
          ['18', 0.5],
          ['27', 0.75],
        ] as const
      ).forEach(([label, f]) => {
        const [x, y] = polar(f * Math.PI * 2, R * 0.85)
        ctx.fillText(label, x, y)
      })
      ctx.textAlign = 'left'
      // ring labels along 120°, where Western European traffic rarely shows up
      for (const ms of RINGS_MS) {
        const [x, y] = polar((Math.PI * 2) / 3, range(ms))
        ctx.fillText(`${ms}`, x + 4, y + 2)
      }
      ctx.fillStyle = C.amber
      ctx.textAlign = 'center'
      ctx.font = font(0.042, 600)
      ctx.fillText('EBAW', R, R - R * 0.05)
      ctx.beginPath()
      ctx.arc(R, R, 2, 0, Math.PI * 2)
      ctx.fill()

      // sweep and its afterglow
      const trail = Math.PI * 0.55
      if ('createConicGradient' in ctx) {
        const cg = ctx.createConicGradient(sweep - Math.PI / 2 - trail, R, R)
        cg.addColorStop(0, 'rgba(95,212,230,0)')
        cg.addColorStop(1, mayday ? 'rgba(255,91,71,.32)' : 'rgba(95,212,230,.28)')
        ctx.fillStyle = cg
        ctx.beginPath()
        ctx.moveTo(R, R)
        ctx.arc(R, R, R, sweep - Math.PI / 2 - trail, sweep - Math.PI / 2)
        ctx.closePath()
        ctx.fill()
      }
      const [sx, sy] = polar(sweep, R)
      ctx.strokeStyle = mayday ? C.bad : C.scope
      ctx.lineWidth = 1.6
      ctx.beginPath()
      ctx.moveTo(R, R)
      ctx.lineTo(sx, sy)
      ctx.stroke()

      // traffic: flights sharing a gate fan out a few degrees so their data blocks stay readable
      const perGate: Record<string, number> = {}
      const side: Record<string, boolean> = {}
      blips.current = flights.map((f) => {
        const key = f.gate ?? 'none'
        const n = (perGate[key] = (perGate[key] ?? -1) + 1)
        const airport = f.gate ? AIRPORTS[f.gate] : undefined
        const base = airport ? bearingTo(airport[1], airport[2]) : ((hashOf(f.id) % 360) * Math.PI) / 180
        const a = base + (n % 2 ? 1 : -1) * Math.ceil(n / 2) * 0.28
        const r = f.ping === null ? R * 0.95 : range(f.ping)
        const [x, y] = polar(a, r)
        const color = !f.core
          ? C.dim
          : f.status === 'cancelled'
            ? C.bad
            : f.status === 'delayed' || f.status === 'maint'
              ? C.amber
              : f.status === 'sched'
                ? C.ink
                : C.scope
        // the second flight at a gate writes its data block on the other side
        side[f.id] = x > R * 1.45 || (n % 2 === 1 && x > R * 0.55)
        return { id: f.id, x, y, a, color, flight: f }
      })

      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      for (const b of blips.current) {
        const f = b.flight
        const glow = reduce ? 1 : Math.max(0.3, 1 - (since(b.a) / (Math.PI * 2)) * 1.25)
        const blink = f.status === 'cancelled' && !reduce && Math.floor(t / 500) % 2 === 0
        // history trail: the previous checks, fading out
        f.trail.forEach((ping, i) => {
          const [hx, hy] = polar(b.a, range(ping))
          ctx.globalAlpha = glow * (0.12 + (i / f.trail.length) * 0.3)
          ctx.fillStyle = b.color
          ctx.fillRect(hx - 1.2, hy - 1.2, 2.4, 2.4)
        })
        ctx.globalAlpha = blink ? 0.25 : glow
        ctx.fillStyle = b.color
        ctx.shadowColor = b.color
        ctx.shadowBlur = reduce ? 0 : 8 * glow
        if (f.status === 'sched') {
          ctx.strokeStyle = b.color
          ctx.setLineDash([2, 2])
          ctx.beginPath()
          ctx.arc(b.x, b.y, 4, 0, Math.PI * 2)
          ctx.stroke()
          ctx.setLineDash([])
        } else if (f.core) {
          ctx.beginPath()
          ctx.arc(b.x, b.y, 3.4, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillRect(b.x - 2.6, b.y - 2.6, 5.2, 5.2)
        }
        ctx.shadowBlur = 0
        if (selected === f.id) {
          ctx.strokeStyle = b.color
          ctx.lineWidth = 1
          ctx.strokeRect(b.x - 8, b.y - 8, 16, 16)
        }
        // data block with leader line, ATC style
        const left = side[f.id]
        const lx = b.x + (left ? -10 : 10)
        const ly = b.y - 10
        ctx.globalAlpha = glow * 0.9
        ctx.strokeStyle = b.color
        ctx.beginPath()
        ctx.moveTo(b.x + (left ? -4 : 4), b.y - 4)
        ctx.lineTo(lx, ly + 2)
        ctx.stroke()
        ctx.textAlign = left ? 'right' : 'left'
        ctx.font = font(0.045, 600)
        ctx.fillText(f.callsign, lx + (left ? -2 : 2), ly - 2)
        ctx.font = font(0.04)
        const second =
          f.status === 'cancelled'
            ? 'DOWN 7700'
            : f.status === 'sched'
              ? 'INBOUND'
              : `${String(f.ping).padStart(3, '0')} ${f.gate ?? ''}`
        ctx.fillText(second, lx + (left ? -2 : 2), ly + R * 0.05)
      }

      // something unlisted at the edge of coverage
      const ga = Math.atan2(GHOST.x, -GHOST.y)
      const gl = reduce ? 0.12 : Math.max(0, 1 - since(ga) / 0.9) * 0.65
      if (gl > 0.01) {
        ctx.globalAlpha = gl
        ctx.fillStyle = C.ink
        ctx.beginPath()
        ctx.arc(R + GHOST.x * R, R + GHOST.y * R, 2.4, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      ctx.textAlign = 'left'

      ctx.strokeStyle = C.rule
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(R, R, R - 1, 0, Math.PI * 2)
      ctx.stroke()
    }

    const loop = (t: number) => {
      draw(t)
      frame = requestAnimationFrame(loop)
    }
    redraw.current = () => {
      if (reduce) draw(0)
    }
    resize()
    if (reduce) draw(0)
    else frame = requestAnimationFrame(loop)
    const ro = new ResizeObserver(() => {
      resize()
      if (reduce) draw(0)
    })
    ro.observe(cv)
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
    }
  }, [])

  useEffect(() => {
    redraw.current()
  }, [flights, selected, mayday])

  const pick = (e: MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const R = size.current
    if (Math.hypot(x - (R + GHOST.x * R), y - (R + GHOST.y * R)) < 12) return onSelect(GHOST_ID)
    let best: Blip | null = null
    let dist = 20
    for (const b of blips.current) {
      const d = Math.hypot(x - b.x, y - b.y)
      if (d < dist) [best, dist] = [b, d]
    }
    onSelect(best ? best.id : null)
  }

  return (
    <canvas
      ref={canvas}
      className="eurth-radar"
      onClick={pick}
      aria-label="Approach radar: each site is a blip; bearing points to the airport its last check ran from, distance from the centre is the response time"
    />
  )
}
