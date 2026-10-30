import { Html, Head, Main, NextScript } from 'next/document'
import { ColorSchemeScript } from '@mantine/core'
// Eurth fork change: title, description, share card and icons in the server-rendered head
import HeadMeta from '@/components/eurth/HeadMeta'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Eurth fork change: single dark console look */}
        <ColorSchemeScript forceColorScheme="dark" />
        <meta name="theme-color" content="#0a161d" />
        <HeadMeta />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
