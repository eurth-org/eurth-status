// Animated radar favicon: the static /eurth-favicon.svg redrawn on a canvas with a turning sweep
// and swapped into every <link rel="icon">. Browsers don't animate SVG favicons, so this is the
// only way to get motion in the tab. Red under squawk 7700; still with reduced motion.
import { useEffect } from 'react'

const SWEEP_MS = 4000

export default function AnimatedFavicon() {
  useEffect(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 64
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const draw = (t: number) => {
      const color = document.body.classList.contains('eurth-mayday') ? '#ff5b47' : '#f2b33d'
      const angle = reduce ? Math.PI / 4 : ((t % SWEEP_MS) / SWEEP_MS) * Math.PI * 2
      const at = (a: number, r: number): [number, number] => [32 + Math.sin(a) * r, 32 - Math.cos(a) * r]
      ctx.clearRect(0, 0, 64, 64)
      ctx.fillStyle = '#0a161d'
      ctx.beginPath()
      ctx.roundRect(0, 0, 64, 64, 14)
      ctx.fill()
      ctx.strokeStyle = color
      ctx.lineCap = 'round'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(32, 32, 22, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 0.55
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(32, 32, 11, 0, Math.PI * 2)
      ctx.stroke()
      // afterglow wedge trailing the sweep
      ctx.globalAlpha = 0.35
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(32, 32)
      ctx.arc(32, 32, 22, angle - Math.PI / 2 - Math.PI / 4, angle - Math.PI / 2)
      ctx.closePath()
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(32, 32)
      ctx.lineTo(...at(angle, 22))
      ctx.stroke()
      // the blip lights up as the sweep passes it, then fades
      const blip = (Math.PI * 5) / 4
      const since = (((angle - blip) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
      ctx.globalAlpha = reduce ? 1 : Math.max(0.25, 1 - since / Math.PI)
      ctx.fillStyle = '#5ad08c'
      ctx.beginPath()
      ctx.arc(...at(blip, 14), 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1

      const href = canvas.toDataURL('image/png')
      document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]').forEach((link) => {
        link.type = 'image/png'
        link.href = href
      })
    }

    draw(performance.now())
    if (reduce) return
    // a timer rather than requestAnimationFrame: background tabs pause frames, but still tick
    // timers (about once a second), and the tab icon matters most when the tab is not in front
    const id = setInterval(() => draw(performance.now()), 100)
    return () => clearInterval(id)
  }, [])

  return null
}
