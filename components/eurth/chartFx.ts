// Latency charts as radar traces: cyan line with a glow, a faint fill, and light packets
// streaming along the line. Registered globally, so the upstream DetailChart stays untouched.
import { Chart, ChartDataset, Filler, Plugin, ScriptableContext } from 'chart.js'

const SCOPE = '#5fd4e6'
const PACKETS = 3
const SPEED = 90 // px per second

export function setupCharts(monoFont: string) {
  Chart.register(Filler)
  Chart.defaults.color = '#7f9ba6'
  Chart.defaults.borderColor = '#1e3a47'
  Chart.defaults.font.family = monoFont
  Chart.defaults.font.size = 11
  // set() creates the path, which only exists once DetailChart registers the Tooltip plugin
  Chart.defaults.set('plugins.tooltip', {
    backgroundColor: '#07121a',
    borderColor: '#1e3a47',
    borderWidth: 1,
    titleColor: '#f2b33d',
    bodyColor: '#d6e5ea',
    cornerRadius: 2,
  })
  Chart.register(trace, packets)
  // charts drawn before the pixel font loaded pick it up on a quiet redraw
  if (typeof document !== 'undefined') {
    document.fonts?.ready.then(() => Object.values(Chart.instances).forEach((chart) => chart.update('none')))
  }
}

const trace: Plugin<'line'> = {
  id: 'eurthTrace',
  beforeUpdate(chart) {
    chart.data.datasets.forEach((d) => {
      const dataset = d as ChartDataset<'line'>
      dataset.borderColor = SCOPE
      dataset.fill = 'start'
      dataset.backgroundColor = (ctx: ScriptableContext<'line'>) => {
        const area = ctx.chart.chartArea
        if (!area) return 'transparent'
        const g = ctx.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom)
        g.addColorStop(0, 'rgba(95,212,230,.16)')
        g.addColorStop(1, 'rgba(95,212,230,0)')
        return g
      }
    })
  },
  beforeDatasetDraw(chart) {
    chart.ctx.save()
    chart.ctx.shadowColor = 'rgba(95,212,230,.55)'
    chart.ctx.shadowBlur = 8
  },
  afterDatasetDraw(chart) {
    chart.ctx.restore()
  },
}

// One overlay canvas per chart; a single animation loop draws the packets on all visible ones
type Track = { chart: Chart; overlay: HTMLCanvasElement; pts: [number, number][]; lens: number[]; visible: boolean }
const tracks = new Map<Chart, Track>()
let frame = 0

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const watcher =
  typeof IntersectionObserver === 'undefined'
    ? null
    : new IntersectionObserver((entries) => {
        for (const e of entries) {
          for (const t of Array.from(tracks.values())) if (t.overlay === e.target) t.visible = e.isIntersecting
        }
      })

function loop(time: number) {
  for (const t of Array.from(tracks.values())) {
    if (!t.visible) continue
    const ctx = t.overlay.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, t.overlay.width, t.overlay.height)
    const total = t.lens[t.lens.length - 1]
    if (!total) continue
    ctx.globalCompositeOperation = 'lighter'
    for (let p = 0; p < PACKETS; p++) {
      const head = (((time / 1000) * SPEED + (p * total) / PACKETS) % total + total) % total
      // a comet: white-hot head in a cyan halo, fading tail behind it
      for (let k = 15; k >= 0; k--) {
        const s = head - k * 5
        if (s < 0) continue
        const [x, y] = pointAt(t, s)
        const fade = 1 - k / 16
        const radius = k === 0 ? 14 : 5 * fade
        const g = ctx.createRadialGradient(x, y, 0, x, y, radius)
        g.addColorStop(0, `rgba(235,253,255,${fade})`)
        g.addColorStop(k === 0 ? 0.18 : 0.4, `rgba(95,212,230,${0.75 * fade})`)
        g.addColorStop(1, 'rgba(95,212,230,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.globalCompositeOperation = 'source-over'
  }
  frame = tracks.size ? requestAnimationFrame(loop) : 0
}

function pointAt(t: Track, s: number): [number, number] {
  let lo = 0
  let hi = t.lens.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (t.lens[mid] < s) lo = mid + 1
    else hi = mid
  }
  const i = Math.max(1, lo)
  const seg = t.lens[i] - t.lens[i - 1] || 1
  const f = (s - t.lens[i - 1]) / seg
  const [x0, y0] = t.pts[i - 1]
  const [x1, y1] = t.pts[i]
  return [x0 + (x1 - x0) * f, y0 + (y1 - y0) * f]
}

const packets: Plugin<'line'> = {
  id: 'eurthPackets',
  afterRender(chart) {
    if (reduced()) return
    const canvas = chart.canvas
    const host = canvas.parentElement
    if (!host) return
    let t = tracks.get(chart)
    if (!t) {
      const overlay = document.createElement('canvas')
      overlay.className = 'eurth-packets'
      overlay.setAttribute('aria-hidden', 'true')
      host.style.position = 'relative'
      host.appendChild(overlay)
      t = { chart, overlay, pts: [], lens: [], visible: true }
      tracks.set(chart, t)
      watcher?.observe(overlay)
    }
    const dpr = window.devicePixelRatio || 1
    t.overlay.width = Math.round(canvas.clientWidth * dpr)
    t.overlay.height = Math.round(canvas.clientHeight * dpr)
    t.overlay.style.width = `${canvas.clientWidth}px`
    t.overlay.style.height = `${canvas.clientHeight}px`
    t.pts = chart
      .getDatasetMeta(0)
      .data.map((p) => [p.x, p.y] as [number, number])
      .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
    t.lens = [0]
    for (let i = 1; i < t.pts.length; i++) {
      const [x0, y0] = t.pts[i - 1]
      const [x1, y1] = t.pts[i]
      t.lens.push(t.lens[i - 1] + Math.hypot(x1 - x0, y1 - y0))
    }
    if (!frame) frame = requestAnimationFrame(loop)
  },
  afterDestroy(chart) {
    const t = tracks.get(chart)
    if (!t) return
    watcher?.unobserve(t.overlay)
    t.overlay.remove()
    tracks.delete(chart)
  },
}
