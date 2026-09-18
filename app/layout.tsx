import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Manrope, Space_Grotesk } from 'next/font/google'
import './globals.css'

const sans = Manrope({ subsets: ['latin'], variable: '--font-sans', display: 'swap', weight: 'variable' })
const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap', weight: 'variable' })

export const metadata: Metadata = {
  title: {
    default: 'Sierra Electric Technologies | Engineering a Cleaner, Smarter Future',
    template: '%s | Sierra Electric Technologies',
  },
  description:
    'Sierra Electric Technologies is a youth-led Sierra Leonean technology and engineering company building practical clean energy, electric mobility, agriculture and climate solutions for Sierra Leone and Africa.',
  openGraph: {
    title: 'Sierra Electric Technologies',
    description: 'Sierra Leonean clean technology, electric mobility and climate solutions.',
    type: 'website',
    locale: 'en_SL',
  },
  twitter: {
    card: 'summary',
    title: 'Sierra Electric Technologies',
    description: 'Sierra Leonean clean technology, electric mobility and climate solutions.',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f6f7f4',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}