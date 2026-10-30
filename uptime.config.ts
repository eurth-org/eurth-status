// This is a simplified example config file for quickstart
// Some not frequently used features are omitted/commented out here
// For a full-featured example, please refer to `uptime.config.full.ts`

// Don't edit this line
import { MaintenanceConfig, PageConfig, WorkerConfig } from './types/config'

// Tags outgoing links so the sites we link to can see the visit came from the status page
const ref = (url: string) => {
  const u = new URL(url)
  u.searchParams.set('ref', 'status.eurth.org')
  return u.toString()
}

const pageConfig: PageConfig = {
  // Title for your status page
  // Also the search and link-preview title (components/eurth/HeadMeta.tsx); keep it under 60 characters
  title: "Eurth Status · Live uptime for eurth.org, map, news and gov",
  // Static radar icon; the page animates it in the tab (components/eurth/Favicon.tsx)
  favicon: '/eurth-favicon.svg',
  // Links shown at the header of your status page, could set `highlight` to `true`
  links: [
    { link: ref('https://github.com/eurth-org/eurth-status'), label: 'Hangar' },
    { link: ref('https://eurth.org/'), label: 'Terminal' },
    // Hangar = the code on GitHub, Terminal = the forum; tower calls land as issues in the eurth-org repo,
    // so the whole team sees them
    { link: ref('https://github.com/eurth-org/eurth-status/issues/new'), label: 'Call the tower', highlight: true },
  ],
  // Monitors are shown per group, in this order; a monitor left out of every group is hidden
  group: {
    'Mainline fleet': ['eurth_homepage', 'eurth_map', 'eurth_news', 'eurth_gov'],
    'Heritage fleet': ['europans_homepage'],
  },
  customFooter: `<p class="eurth-footer">Monitoring for the <a href="${ref('https://eurth.org/')}" target="_blank">Eurth</a> community · powered by <a href="${ref('https://github.com/lyc8503/UptimeFlare')}" target="_blank">UptimeFlare</a>, made with ❤ by <a href="${ref('https://github.com/lyc8503')}" target="_blank">lyc8503</a>.</p>`,
}

const workerConfig: WorkerConfig = {
  // Define all your monitors here
  monitors: [
    // -------------------------------------
    // Monitor 1: eurth_homepage
    // -------------------------------------
    {
      id: 'eurth_homepage',
      name: 'eurth.org',
      method: 'GET',
      target: 'https://eurth.org',
      checkProxy: 'worker://weur',
      tooltip: 'Primary homepage monitor',
      statusPageLink: ref('https://eurth.org'),
      expectedCodes: [200],
      timeout: 10000,
      headers: {
        'User-Agent': 'Uptimeflare',
        Authorization: 'Bearer YOUR_TOKEN_HERE',
      }, // <-- Closes the headers object
    }, // <-- Closes the first monitor object

    // -------------------------------------
    // Monitor 2: eurth_map
    // -------------------------------------
    {
      id: 'eurth_map',
      name: 'map.eurth.org',
      method: 'GET',
      target: 'https://map.eurth.org',
      checkProxy: 'worker://weur',
      tooltip: 'Map subdomain monitor',
      statusPageLink: ref('https://map.eurth.org'),
      expectedCodes: [200],
      timeout: 10000,
      headers: {
        'User-Agent': 'Uptimeflare',
        Authorization: 'Bearer YOUR_TOKEN_HERE',
      }, // <-- Closes the headers object
    }, // <-- Closes the second monitor object

    // -------------------------------------
    // Monitor 3: eurth_news
    // -------------------------------------
    {
      id: 'eurth_news',
      name: 'news.eurth.org',
      method: 'GET',
      target: 'https://news.eurth.org',
      checkProxy: 'worker://weur',
      tooltip: 'News subdomain monitor',
      statusPageLink: ref('https://news.eurth.org'),
      expectedCodes: [200],
      timeout: 10000,
      headers: {
        'User-Agent': 'Uptimeflare',
        Authorization: 'Bearer YOUR_TOKEN_HERE',
      }, // <-- Closes the headers object
    }, // <-- Closes the second monitor object

    // -------------------------------------
    // Monitor 4: eurth_gov
    // -------------------------------------
    {
      id: 'eurth_gov',
      name: 'gov.eurth.org',
      method: 'GET',
      target: 'https://gov.eurth.org',
      checkProxy: 'worker://weur',
      tooltip: 'Government subdomain monitor',
      statusPageLink: ref('https://gov.eurth.org'),
      expectedCodes: [200],
      timeout: 10000,
      headers: {
        'User-Agent': 'Uptimeflare',
        Authorization: 'Bearer YOUR_TOKEN_HERE',
      }, // <-- Closes the headers object
    }, // <-- Closes the fourth monitor object

    // -------------------------------------
    // Monitor 5: europans_homepage
    // -------------------------------------
    {
      id: 'europans_homepage',
      name: 'europans.com',
      method: 'GET',
      target: 'https://www.europans.com',
      checkProxy: 'worker://weur',
      tooltip: 'Legacy domain, kept online for monitoring',
      statusPageLink: ref('https://www.europans.com'),
      expectedCodes: [200],
      timeout: 10000,
      headers: {
        'User-Agent': 'Uptimeflare',
        Authorization: 'Bearer YOUR_TOKEN_HERE',
      }, // <-- Closes the headers object
    }, // <-- Closes the second monitor object
    
  ], // <-- Closes the monitors array

  // [Optional] Notification settings
  notification: {
    webhook: {
      url: 'https://api.telegram.org/bot123456:ABCDEF/sendMessage',
      payloadType: 'x-www-form-urlencoded',
      payload: {
        chat_id: 12345678,
        text: '$MSG',
      },
      timeout: 10000,
    },
    timeZone: 'Europe/London',
    gracePeriod: 5,
  },
} // <-- Closes workerConfig object

const maintenances: MaintenanceConfig[] = [
  /*
  {
    monitors: ['foo_monitor', 'bar_monitor'],
    title: 'Test Maintenance',
    body: 'This is a test maintenance, server software upgrade',
    start: '2020-01-01T00:00:00+08:00',
    end: '2050-01-01T00:00:00+08:00',
    color: 'blue',
  },
  */
] // <-- Closes maintenances array

// Don't edit this line
export { maintenances, pageConfig, workerConfig }
