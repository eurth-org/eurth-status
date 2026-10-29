import { Html, Head, Main, NextScript } from 'next/document'
import { ColorSchemeScript } from '@mantine/core'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <ColorSchemeScript forceColorScheme="dark" />
        <meta name="theme-color" content="#0a161d" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
