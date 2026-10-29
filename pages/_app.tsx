import '@mantine/core/styles.css'
// Eurth fork change: theme, fonts and aviation wording (styles/eurth.*, components/eurth/)
import '@/styles/eurth.css'
import type { AppProps } from 'next/app'
import { MantineProvider } from '@mantine/core'
import NoSsr from '@/components/NoSsr'
import { eurthFonts, eurthTheme } from '@/styles/eurth'
import '@/util/i18n'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <NoSsr>
      <style>{eurthFonts}</style>
      <MantineProvider theme={eurthTheme} forceColorScheme="dark">
        <Component {...pageProps} />
      </MantineProvider>
    </NoSsr>
  )
}
