// Aviation wording for the upstream components, layered over their translations
// so locales/*.json stay as upstream ships them.
import i18n from '@/util/i18n'
import { pageConfig } from '@/uptime.config'

const AVIATION = {
  Incidents: 'NOTAMs',
  'Last updated on': 'Last radar sweep: {{date}} ({{seconds}} s ago)',
  Operational: 'operational',
  Overall: 'On time {{percent}}%',
  'No Data': 'No radar contact',
  'percent at date': '{{percent}}% on time · {{date}}',
  'Down for': 'Grounded for {{duration}} (tap for the flight log)',
  'incidents at': '{{name}} · flight log {{date}}',
  'Response times': 'Response times (ms) · radar track',
  'No data available': 'Inbound: no radar contact yet. The first check runs after the next deploy.',
  'Scheduled Maintenance': 'Scheduled maintenance',
  'Affected components': 'Affected aircraft:',
  'No incidents in this month': 'No NOTAMs this month',
  'There are no incidents for this month': 'Clear skies: no incidents logged this month.',
  'Select monitor': 'Select aircraft',
  All: 'Whole fleet',
  Backwards: '← Previous month',
  Forward: 'Next month →',
}

const languages = Object.keys(i18n.options.resources ?? {})
for (const lng of languages) i18n.addResourceBundle(lng, 'common', AVIATION, true, true)

// MonitorList remembers which groups were open by name. After the group names change, a stale
// list would collapse every group for returning visitors, so start fresh once per set of names.
if (typeof window !== 'undefined') {
  try {
    const names = JSON.stringify(Object.keys(pageConfig.group ?? {}))
    if (localStorage.getItem('eurthGroups') !== names) {
      localStorage.removeItem('expandedGroups')
      localStorage.setItem('eurthGroups', names)
    }
  } catch (e) {
    // storage blocked: MonitorList falls back to all groups open
  }
}
