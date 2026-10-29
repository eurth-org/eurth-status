// Solari-style split-flap row: every cell flips forward through the drum until it shows its character
import { CSSProperties, useEffect, useRef, useState } from 'react'

const DRUM = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.%-:/'

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function Cell({ char, delay }: { char: string; delay: number }) {
  const goal = DRUM.includes(char) ? char : ' '
  const shown = useRef(' ')
  const [face, setFace] = useState({ cur: ' ', prev: ' ', n: 0, ms: 0 })

  useEffect(() => {
    if (reduced()) {
      shown.current = goal
      setFace((f) => ({ cur: goal, prev: goal, n: f.n, ms: 0 }))
      return
    }
    let timer: ReturnType<typeof setTimeout>
    const step = () => {
      if (shown.current === goal) return
      const i = DRUM.indexOf(shown.current)
      const gap = (DRUM.indexOf(goal) - i + DRUM.length) % DRUM.length
      // fast through the middle of the drum, settling on the last few flaps
      const ms = Math.round(Math.max(16, Math.min(80, 260 / gap)))
      const prev = shown.current
      shown.current = DRUM[(i + 1) % DRUM.length]
      setFace((f) => ({ cur: shown.current, prev, n: f.n + 1, ms }))
      timer = setTimeout(step, ms * 2.2 + 12)
    }
    timer = setTimeout(step, delay)
    return () => clearTimeout(timer)
  }, [goal, delay])

  const show = (c: string) => (c === ' ' ? ' ' : c)
  return (
    <span
      key={face.n}
      className="eurth-flap"
      data-go={face.ms > 0 ? '' : undefined}
      style={{ '--fd': `${face.ms}ms` } as CSSProperties}
    >
      <span className="t">
        <i>{show(face.cur)}</i>
      </span>
      <span className="b">
        <i>{show(face.prev)}</i>
      </span>
      <span className="ft">
        <i>{show(face.prev)}</i>
      </span>
      <span className="fb">
        <i>{show(face.cur)}</i>
      </span>
    </span>
  )
}

export default function SplitFlap({
  text,
  cells,
  className,
  stagger = 70,
}: {
  text: string
  cells: number
  className?: string
  stagger?: number
}) {
  const chars = text.toUpperCase().padEnd(cells).slice(0, cells).split('')
  return (
    <span className={`eurth-flaps${className ? ' ' + className : ''}`} role="img" aria-label={text.trim()}>
      {chars.map((c, i) => (
        <Cell key={i} char={c} delay={i * stagger} />
      ))}
    </span>
  )
}
