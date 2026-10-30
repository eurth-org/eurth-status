// Turns UptimeFlare monitor state into "flights" for the Eurth tower console:
// status, ping, the airport the check ran from, uptime and a callsign.
import { MonitorState, MonitorTarget } from '@/types/config'
import { maintenances, pageConfig } from '@/uptime.config'

export type FlightStatus = 'ontime' | 'delayed' | 'cancelled' | 'maint' | 'sched'

export const STATUS_LABEL: Record<FlightStatus, string> = {
  ontime: 'On time',
  delayed: 'Delayed',
  cancelled: 'Cancelled',
  maint: 'Maintenance',
  sched: 'Scheduled',
}

// Above this response time a flight counts as delayed
export const DELAYED_MS = 1000

// Callsigns shown on the board, radar and flip cards; other monitors get one from their name
const CALLSIGNS: Record<string, string> = {
  eurth_homepage: 'EUR001',
  eurth_map: 'MAP002',
  eurth_news: 'NWS003',
  eurth_gov: 'GOV004',
  europans_homepage: 'EPN901',
}

// The tower sits at Antwerp-Deurne; radar bearings point from here to the checking airport
export const HOME = { code: 'EBAW', name: 'Antwerp-Deurne', lat: 51.19, lon: 4.46 }

// Cloudflare names its data centres after the nearest airport's IATA code
export const AIRPORTS: Record<string, [string, number, number]> = {
  AMS: ['Amsterdam Schiphol', 52.31, 4.76],
  ARN: ['Stockholm Arlanda', 59.65, 17.92],
  ATH: ['Athens', 37.94, 23.94],
  BCN: ['Barcelona', 41.3, 2.08],
  BER: ['Berlin Brandenburg', 52.36, 13.5],
  BRU: ['Brussels', 50.9, 4.48],
  BUD: ['Budapest', 47.44, 19.26],
  CDG: ['Paris Charles de Gaulle', 49.01, 2.55],
  CPH: ['Copenhagen', 55.62, 12.65],
  DUB: ['Dublin', 53.43, -6.25],
  DUS: ['Düsseldorf', 51.29, 6.77],
  EDI: ['Edinburgh', 55.95, -3.37],
  FCO: ['Rome Fiumicino', 41.8, 12.25],
  FRA: ['Frankfurt', 50.03, 8.57],
  GVA: ['Geneva', 46.24, 6.11],
  HAM: ['Hamburg', 53.63, 9.99],
  HEL: ['Helsinki', 60.32, 24.96],
  LHR: ['London Heathrow', 51.47, -0.45],
  LIS: ['Lisbon', 38.77, -9.13],
  LUX: ['Luxembourg', 49.63, 6.21],
  MAD: ['Madrid Barajas', 40.47, -3.56],
  MAN: ['Manchester', 53.35, -2.28],
  MRS: ['Marseille', 43.44, 5.22],
  MUC: ['Munich', 48.35, 11.79],
  MXP: ['Milan Malpensa', 45.63, 8.72],
  OSL: ['Oslo', 60.19, 11.1],
  PRG: ['Prague', 50.1, 14.26],
  TPE: ['Taipei Taoyuan', 25.08, 121.23],
  VIE: ['Vienna', 48.11, 16.57],
  WAW: ['Warsaw Chopin', 52.17, 20.97],
  ZRH: ['Zurich', 47.46, 8.55],
}

export type Flight = {
  id: string
  name: string
  callsign: string
  link?: string
  fleet: string | null
  core: boolean
  status: FlightStatus
  ping: number | null
  gate: string | null
  lastCheck: number | null
  uptime: string | null
  incidents24h: number
  trail: number[]
  error: string | null
}

export function hashOf(s: string) {
  let h = 2166136261
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}

export function callsignOf(monitor: MonitorTarget) {
  return CALLSIGNS[monitor.id] ?? monitor.name.replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase() + (hashOf(monitor.id) % 900 + 100)
}

// Initial great-circle bearing in radians, clockwise from north
export function bearingTo(lat: number, lon: number) {
  const rad = Math.PI / 180
  const [p1, p2, dl] = [HOME.lat * rad, lat * rad, (lon - HOME.lon) * rad]
  const y = Math.sin(dl) * Math.cos(p2)
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl)
  return (Math.atan2(y, x) + Math.PI * 2) % (Math.PI * 2)
}

export function airportName(code: string | null) {
  return code ? AIRPORTS[code]?.[0] ?? code : 'no contact yet'
}

export function buildFlights(state: MonitorState, monitors: MonitorTarget[]): Flight[] {
  const groups = Object.entries(pageConfig.group ?? {})
  const coreIds = groups[0]?.[1] ?? monitors.map((m) => m.id)
  const now = Date.now() / 1000
  const inMaintenance = (id: string) =>
    maintenances.some(
      (m) =>
        new Date() >= new Date(m.start) &&
        (!m.end || new Date() <= new Date(m.end)) &&
        m.monitors?.includes(id)
    )

  // Board order follows the groups, then any ungrouped monitors
  const order = (id: string) => {
    const flat = groups.flatMap(([, ids]) => ids)
    const i = flat.indexOf(id)
    return i === -1 ? flat.length : i
  }

  return [...monitors]
    .sort((a, b) => order(a.id) - order(b.id))
    .map((monitor) => {
      const latency = state.latency[monitor.id] ?? []
      const incidents = state.incident[monitor.id] ?? []
      const last = latency[latency.length - 1]
      const open = incidents.length > 0 && incidents[incidents.length - 1].end === null

      let uptime: string | null = null
      if (incidents.length > 0) {
        const total = now - incidents[0].start[0]
        const down = incidents.reduce((sum, i) => sum + ((i.end ?? now) - i.start[0]), 0)
        uptime = (((total - down) / total) * 100).toPrecision(4)
      }

      let status: FlightStatus = 'ontime'
      if (!last) status = 'sched'
      else if (inMaintenance(monitor.id)) status = 'maint'
      else if (open) status = 'cancelled'
      else if (last.ping > DELAYED_MS) status = 'delayed'

      return {
        id: monitor.id,
        name: monitor.name,
        callsign: callsignOf(monitor),
        link: monitor.statusPageLink,
        fleet: groups.find(([, ids]) => ids.includes(monitor.id))?.[0] ?? null,
        core: coreIds.includes(monitor.id),
        status,
        ping: last ? last.ping : null,
        gate: last ? last.loc : null,
        lastCheck: last ? last.time : null,
        uptime,
        incidents24h: incidents.filter((i) => i.start[0] > now - 86400 && i.error[0] !== 'dummy')
          .length,
        trail: latency.slice(-7, -1).map((p) => p.ping),
        error: open ? incidents[incidents.length - 1].error.slice(-1)[0] : null,
      }
    })
}

export const PHONETIC = 'ALPHA BRAVO CHARLIE DELTA ECHO FOXTROT GOLF HOTEL INDIA JULIETT KILO LIMA MIKE NOVEMBER OSCAR PAPA QUEBEC ROMEO SIERRA TANGO UNIFORM VICTOR WHISKEY XRAY YANKEE ZULU'.split(
  ' '
)

// ATIS letters advance every hour, as a real broadcast would
export function atisLetter(at: Date) {
  return PHONETIC[at.getUTCHours() % 26]
}

export function zulu(at: Date) {
  return at.toISOString().slice(11, 16).replace(':', '') + 'Z'
}

export function brussels(at: Date, seconds = false) {
  return at.toLocaleTimeString('en-GB', {
    timeZone: 'Europe/Brussels',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    ...(seconds ? { second: '2-digit' } : {}),
  })
}

export function atisText(flights: Flight[], lastUpdate: number, letter: string) {
  const fleets = Object.keys(pageConfig.group ?? {})
  const parts = [`EURTH TOWER INFORMATION ${letter}`, `TIME ${zulu(new Date(lastUpdate * 1000))}`]
  for (const fleet of fleets) {
    const members = flights.filter((f) => f.fleet === fleet && f.status !== 'sched')
    if (members.length === 0) continue
    const up = members.filter((f) => f.status === 'ontime' || f.status === 'delayed').length
    parts.push(`${fleet.toUpperCase()} ${up} OF ${members.length} OPERATIONAL`)
  }
  const pings = flights.filter((f) => f.ping !== null && f.status !== 'cancelled').map((f) => f.ping!)
  if (pings.length) parts.push(`AVERAGE PING ${Math.round(pings.reduce((a, b) => a + b, 0) / pings.length)} MS`)
  const gates = Array.from(new Set(flights.map((f) => f.gate).filter(Boolean)))
  if (gates.length) parts.push(`RADAR CONTACT VIA ${gates.join(' ')}`)
  const incidents = flights.reduce((n, f) => n + f.incidents24h, 0)
  parts.push(incidents ? `${incidents} INCIDENT${incidents > 1 ? 'S' : ''} LOGGED LAST 24 HOURS` : 'NO INCIDENTS LAST 24 HOURS')
  const grounded = flights.filter((f) => f.status === 'cancelled')
  const delayed = flights.filter((f) => f.status === 'delayed')
  const inbound = flights.filter((f) => f.status === 'sched')
  if (grounded.length) parts.push(`CAUTION ${grounded.map((f) => f.name.toUpperCase()).join(', ')} GROUNDED`)
  if (delayed.length) parts.push(`${delayed.map((f) => f.name.toUpperCase()).join(', ')} DELAYED`)
  if (inbound.length) parts.push(`${inbound.map((f) => f.name.toUpperCase()).join(', ')} INBOUND, AWAITING FIRST CONTACT`)
  if (!grounded.length && !delayed.length) parts.push('ALL SYSTEMS NORMAL')
  parts.push('RUNWAY 29 IN USE', `ADVISE ON INITIAL CONTACT YOU HAVE INFORMATION ${letter}`)
  return parts.join(' · ') + ' · '
}
