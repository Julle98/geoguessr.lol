import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['700', '800'],
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'GeoGame — Arvaa missä olet',
  description: 'Selviydy ympäri maailman. Katso. Arvaa. Voita.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fi" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="bg-earth-900 text-white font-body antialiased">
        {children}
      </body>
    </html>
  )
}
