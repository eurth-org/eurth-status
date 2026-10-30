// Head tags rendered on the server (from pages/_document.tsx). The page itself only renders in
// the browser, so without these, link previews and crawlers that skip JavaScript would see no
// title, description, share image or icon at all.
import { pageConfig } from '@/uptime.config'

const SITE = 'https://status.eurth.org'
const TITLE = pageConfig.title ?? 'Eurth Status'
const DESCRIPTION =
  'Is Eurth up? Live status, response times and 90-day uptime for eurth.org, map.eurth.org, news.eurth.org and gov.eurth.org, checked every minute.'
const IMAGE = `${SITE}/og-radar.png`
const IMAGE_ALT =
  'Eurth Status: the Eurth sites as blips on a dark air-traffic radar, beside a departures board showing them all on time'

export default function HeadMeta() {
  return (
    <>
      <title>{TITLE}</title>
      <meta name="description" content={DESCRIPTION} />
      <link rel="icon" href="/eurth-favicon.svg" type="image/svg+xml" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Eurth Status" />
      <meta property="og:url" content={`${SITE}/`} />
      <meta property="og:title" content={TITLE} />
      <meta property="og:description" content={DESCRIPTION} />
      <meta property="og:image" content={IMAGE} />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={IMAGE_ALT} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={TITLE} />
      <meta name="twitter:description" content={DESCRIPTION} />
      <meta name="twitter:image" content={IMAGE} />
      <meta name="twitter:image:alt" content={IMAGE_ALT} />
    </>
  )
}
