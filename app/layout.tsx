import type { Metadata } from 'next'
import { Bungee, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { SessionProvider } from '@/components/SessionProvider'
import './globals.css'

const bungee = Bungee({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400'],
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600', '700', '800'],
})

const BASE_URL = 'https://geoguessr.lol'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Geoguessr.lol',
    template: '%s · Geoguessr.lol',
  },
  description: 'Ilmainen avoimen lähdekoodin geo-arvauspeli party-moodilla. Ei tilausmaksuja. Ei paywallia. Pelkkä maailma, kaverit ja noloja arvauksia.',
  keywords: ['geoguessr', 'geo-arvauspeli', 'ilmainen', 'party', 'street view', 'geography game'],
  authors: [{ name: 'geoguessr.lol' }],
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    url: BASE_URL,
    siteName: 'geoguessr.lol',
    title: 'geoguessr.lol — arvaa tai itke',
    description: 'Ilmainen geo-arvauspeli party-moodilla. Ei tilausmaksuja. Ei paywallia.',
    images: [{ url: '/og', width: 1200, height: 630, alt: 'geoguessr.lol' }],
    locale: 'fi_FI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'geoguessr.lol — arvaa tai itke',
    description: 'Ilmainen geo-arvauspeli party-moodilla. Ei tilausmaksuja. Ei paywallia.',
    images: ['/og'],
  },
  other: {
    'theme-color': '#07021a',
    'color-scheme': 'dark',
    'msapplication-TileColor': '#07021a',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fi" className={`${bungee.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
