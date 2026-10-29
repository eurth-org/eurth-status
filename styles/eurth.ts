// Eurth theme: the "Mission Control" console look. Kept out of the upstream components
// so UptimeFlare updates merge without conflicts; styles/eurth.css holds the rest.
import { createTheme, MantineColorsTuple } from '@mantine/core'
import { Barlow_Condensed, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'
import { Chart } from 'chart.js'

// Self-hosted at build time, so visitors never hit Google's servers
const display = Barlow_Condensed({ subsets: ['latin', 'latin-ext'], weight: ['500', '600', '700'] })
const body = IBM_Plex_Sans({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600'] })
const mono = IBM_Plex_Mono({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600'] })

export const eurthFonts = `:root{--eurth-display:${display.style.fontFamily};--eurth-body:${body.style.fontFamily};--eurth-mono:${mono.style.fontFamily}}`

// Mantine's dark scheme reads text from [0], dimmed text from [2], borders from [4],
// hover from [5], component surfaces from [6] and the page from [7]
const dark: MantineColorsTuple = [
  '#d6e5ea', // ink
  '#b3c6cd',
  '#7f9ba6', // dim
  '#5f7b86',
  '#1e3a47', // rule
  '#132a35', // raised
  '#0f212a', // panel
  '#0a161d', // room
  '#07121a',
  '#050d12',
]

const amber: MantineColorsTuple = [
  '#fff8e6',
  '#fdeec7',
  '#fbe09a',
  '#f8d06b',
  '#f5c24a',
  '#f2b33d',
  '#d99d2c',
  '#b8831f',
  '#946914',
  '#6f4f0b',
]

export const eurthTheme = createTheme({
  colors: { dark, amber },
  primaryColor: 'amber',
  primaryShade: 5,
  fontFamily: 'var(--eurth-body)',
  fontFamilyMonospace: 'var(--eurth-mono)',
  headings: { fontFamily: 'var(--eurth-display)', fontWeight: '700' },
  defaultRadius: 'xs',
})

// Latency charts: phosphor-cyan trace on the console grid
Chart.defaults.color = '#7f9ba6'
Chart.defaults.borderColor = '#1e3a47'
Chart.defaults.font.family = mono.style.fontFamily
Chart.defaults.plugins.tooltip.backgroundColor = '#07121a'
Chart.defaults.plugins.tooltip.borderColor = '#1e3a47'
Chart.defaults.plugins.tooltip.borderWidth = 1
Chart.defaults.plugins.tooltip.titleColor = '#f2b33d'
Chart.defaults.plugins.tooltip.bodyColor = '#d6e5ea'
Chart.defaults.plugins.tooltip.cornerRadius = 2
Chart.register({
  id: 'eurthTrace',
  beforeUpdate(chart) {
    chart.data.datasets.forEach((dataset) => {
      dataset.borderColor = '#5fd4e6'
    })
  },
})
