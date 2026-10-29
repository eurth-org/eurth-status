// The Eurth tower console above the fleet list: status strip, ATIS, radar, tower report,
// split-flap cards for the mainline fleet and a departures board for every monitor.
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { MonitorState, MonitorTarget } from '@/types/config'
import Icon, { IconName } from './icons'
import Radar, { GHOST_ID } from './Radar'
import SplitFlap from './SplitFlap'
import {
  Flight,
  FlightStatus,
  HOME,
  STATUS_LABEL,
  airportName,
  atisLetter,
  atisText,
  brussels,
  buildFlights,
} from './fleet'

const STATUS_ICON: Record<FlightStatus, IconName> = {
  ontime: 'circle-check',
  delayed: 'hourglass-half',
  cancelled: 'circle-xmark',
  maint: 'wrench',
  sched: 'plane-arrival',
}

function ago(seconds: number) {
  if (seconds < 60) return `${Math.max(0, Math.round(seconds))} s ago`
  if (seconds < 3600) return `${Math.round(seconds / 60)} min ago`
  return `${Math.round(seconds / 3600)} h ago`
}

function useNow(ms: number) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}

// Type 7700, 7600 or 7000 anywhere on the page to change the transponder code
function useSquawk(real: string) {
  const [manual, setManual] = useState<string | null>(null)
  useEffect(() => {
    let keys = ''
    const onKey = (e: KeyboardEvent) => {
      if (/^(INPUT|SELECT|TEXTAREA)$/.test((e.target as HTMLElement).tagName)) return
      if (!/^[0-7]$/.test(e.key)) {
        keys = ''
        return
      }
      keys = (keys + e.key).slice(-4)
      if (['7700', '7600', '7000'].includes(keys)) setManual(keys === '7000' ? null : keys)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])
  return manual ?? real
}

function Clocks({ lastUpdate, squawk }: { lastUpdate: number; squawk: string }) {
  const now = useNow(1000)
  return (
    <div className="eurth-strip">
      <div className="eurth-strip-id">
        <Icon name="tower-broadcast" />
        <span>
          EURTH TOWER <b>{HOME.code}</b> · INFORMATION <b>{atisLetter(now)}</b>
        </span>
      </div>
      <div className="eurth-clocks" aria-label="Clocks">
        <span>
          <em>UTC</em>
          <b>{now.toISOString().slice(11, 19)}</b>
        </span>
        <span>
          <em>LT BRU</em>
          <b>{brussels(now, true)}</b>
        </span>
        <span>
          <em>LAST SWEEP</em>
          <b className="ink">{brussels(new Date(lastUpdate * 1000))} LT</b>
        </span>
        <span title="Type 7700, 7600 or 7000 to change it">
          <em>XPDR</em>
          <b className={squawk === '7000' ? 'ink' : 'alert'}>{squawk}</b>
        </span>
      </div>
    </div>
  )
}

function Atis({ text }: { text: string }) {
  return (
    <div className="eurth-atis" aria-label="ATIS broadcast">
      <span>{text.repeat(2)}</span>
    </div>
  )
}

// Each card cycles through uptime, ping and gate on the split-flap display
const MODES = ['UPTIME', 'PING', 'GATE'] as const

function FlightCard({
  flight,
  index,
  selected,
  onSelect,
}: {
  flight: Flight
  index: number
  selected: boolean
  onSelect: () => void
}) {
  const [mode, setMode] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let id: ReturnType<typeof setInterval>
    const start = setTimeout(() => {
      id = setInterval(() => setMode((m) => (m + 1) % MODES.length), 7000)
    }, 4000 + index * 1500)
    return () => {
      clearTimeout(start)
      clearInterval(id)
    }
  }, [index])

  const sched = flight.status === 'sched'
  const value = sched
    ? '------'
    : MODES[mode] === 'UPTIME'
      ? `${flight.uptime}%`
      : MODES[mode] === 'PING'
        ? `${flight.ping} MS`
        : flight.gate ?? ''
  const label = sched ? 'AWAITING' : MODES[mode]

  return (
    <button
      type="button"
      className={`eurth-card${selected ? ' selected' : ''}`}
      data-status={flight.status}
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className="eurth-card-head">
        <span className="cs">{flight.callsign}</span>
        <span className="st">
          <Icon name={STATUS_ICON[flight.status]} />
          {STATUS_LABEL[flight.status]}
        </span>
      </span>
      <span className="eurth-card-name">{flight.name}</span>
      <SplitFlap className="big" text={value} cells={6} />
      <SplitFlap className="label" text={label} cells={8} stagger={40} />
      <span className="eurth-card-sub">
        {sched
          ? 'First radar contact after deploy'
          : `${flight.incidents24h} incident${flight.incidents24h === 1 ? '' : 's'} · 24 h`}
      </span>
    </button>
  )
}

function DataBlock({ flight, id }: { flight?: Flight; id: string | null }) {
  if (id === GHOST_ID)
    return (
      <div className="eurth-datablock" aria-live="polite">
        <b>ORN001 · ORIONI AIRWAYS</b> · squawk 2026
        <br />
        <span className="l2">Port Yomiro → Antwerp-Deurne (EBAW), FL350, unscheduled.</span>
        <br />
        No flight plan on file. Cleared to land runway 29; tell nobody at Eurth.
      </div>
    )
  if (!flight)
    return (
      <div className="eurth-datablock" aria-live="polite">
        Tap a blip or a card to read its data block.
      </div>
    )
  const now = Date.now() / 1000
  return (
    <div className="eurth-datablock" aria-live="polite">
      <b>
        {flight.callsign} · {flight.name.toUpperCase()}
      </b>{' '}
      · {STATUS_LABEL[flight.status]}
      <br />
      <span className="l2">
        {flight.ping === null
          ? 'No radar contact yet; the first check runs after the next deploy.'
          : `Ping ${flight.ping} ms via ${flight.gate} (${airportName(flight.gate)}), ${ago(now - flight.lastCheck!)}.`}
      </span>
      <br />
      {flight.uptime ? `Uptime ${flight.uptime}% since tracking began · ` : ''}
      {flight.fleet ?? 'Unassigned'}
      {flight.error ? ` · last error: ${flight.error}` : ''}
    </div>
  )
}

function Board({
  flights,
  selected,
  onSelect,
}: {
  flights: Flight[]
  selected: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="eurth-bezel">
      <div className="eurth-bezel-head">
        <h2>
          <Icon name="plane-departure" /> Departures · fleet board
        </h2>
        <span className="meta">
          {flights.filter((f) => f.status === 'ontime').length} on time · checked every minute
        </span>
      </div>
      <div className="eurth-fids" role="table" aria-label="Fleet board">
        <div className="row head" role="row">
          <span role="columnheader">STD</span>
          <span role="columnheader">Flight</span>
          <span role="columnheader" className="gate">
            Gate
          </span>
          <span role="columnheader" className="ping">
            Ping
          </span>
          <span role="columnheader">Status</span>
        </div>
        {flights.map((f) => (
          <div
            key={f.id}
            role="row"
            className={`row${selected === f.id ? ' selected' : ''}`}
            onClick={() => onSelect(f.id)}
          >
            <span className="std" role="cell">
              {f.lastCheck ? brussels(new Date(f.lastCheck * 1000)) : '--:--'}
            </span>
            <span className="fl" role="cell">
              <b>{f.callsign}</b> {f.link ? <a href={f.link} target="_blank" onClick={(e) => e.stopPropagation()}>{f.name}</a> : f.name}
              <em>{f.fleet}</em>
            </span>
            <span className="gate" role="cell" title={airportName(f.gate)}>
              {f.gate ?? '---'}
            </span>
            <span className="ping" role="cell">
              {f.ping === null ? '---' : `${f.ping} ms`}
            </span>
            <span className={`st ${f.status}`} role="cell">
              {STATUS_LABEL[f.status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function EurthConsole({
  state,
  monitors,
  children,
}: {
  state: MonitorState
  monitors: MonitorTarget[]
  children: ReactNode
}) {
  const flights = useMemo(() => buildFlights(state, monitors), [state, monitors])
  const core = flights.filter((f) => f.core)
  const [selected, setSelected] = useState<string | null>(null)
  const real = flights.some((f) => f.core && f.status === 'cancelled') ? '7700' : '7000'
  const squawk = useSquawk(real)
  const mayday = squawk === '7700'
  const now = useNow(60000)

  useEffect(() => {
    document.body.classList.toggle('eurth-mayday', mayday)
    document.body.classList.toggle('eurth-nordo', squawk === '7600')
  }, [mayday, squawk])

  const atis =
    squawk === '7700' && real !== '7700'
      ? 'MAYDAY MAYDAY MAYDAY · ALL STATIONS STOP TRANSMITTING · EMERGENCY TRAFFIC IN PROGRESS · NOTHING IS ON FIRE, PROBABLY · SQUAWK 7000 TO CANCEL · '
      : squawk === '7600'
        ? 'RADIO FAILURE · NORDO · CONTROL BY LIGHT SIGNALS ONLY · TRY A WALK OUTSIDE · SQUAWK 7000 TO RESTORE · '
        : atisText(flights, state.lastUpdate, atisLetter(now))

  return (
    <section className="eurth-console" aria-label="Tower console">
      <Clocks lastUpdate={state.lastUpdate} squawk={squawk} />
      <Atis text={atis} />
      <div className="eurth-deck">
        <div className="eurth-bezel eurth-scope">
          <div className="eurth-bezel-head">
            <h2>
              <Icon name="satellite-dish" /> Radar · {HOME.code} approach
            </h2>
            <span className="meta">sweep 6 s</span>
          </div>
          <div className="eurth-scope-wrap">
            <Radar flights={flights} selected={selected} mayday={mayday} onSelect={setSelected} />
          </div>
          <p className="eurth-caption">
            Bearing = checking airport from {HOME.code} · range = response time · rings 50 · 100 · 250 · 500 ms
          </p>
          <DataBlock flight={flights.find((f) => f.id === selected)} id={selected} />
        </div>
        <div className="eurth-right">
          <div className="eurth-bezel eurth-tower">
            <div className="eurth-bezel-head">
              <h2>
                <Icon name="tower-observation" /> Tower report
              </h2>
              <span className="meta">auto-refresh every 5 min</span>
            </div>
            {children}
          </div>
          <div className="eurth-cards">
            {core.map((f, i) => (
              <FlightCard
                key={f.id}
                flight={f}
                index={i}
                selected={selected === f.id}
                onSelect={() => setSelected(selected === f.id ? null : f.id)}
              />
            ))}
          </div>
        </div>
      </div>
      <Board flights={flights} selected={selected} onSelect={setSelected} />
    </section>
  )
}
