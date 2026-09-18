import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { ADDRESS, FACEBOOK_URL } from '@/lib/site'
import './globals.css'

// Self-hosted variable fonts (local files) — no runtime fetch from Google Fonts
const sans = localFont({
  src: './fonts/manrope.woff2',
  variable: '--font-sans',
  display: 'swap',
  weight: '200 800',
})
const display = localFont({
  src: './fonts/space-grotesk.woff2',
  variable: '--font-display',
  display: 'swap',
  weight: '300 700',
})

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
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
    card: 'summary_large_image',
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

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Sierra Electric Technologies',
  alternateName: 'SET',
  url: baseUrl,
  logo: new URL('/icon.svg', baseUrl).toString(),
  foundingDate: '2023-07-29',
  address: {
    '@type': 'PostalAddress',
    streetAddress: ADDRESS,
    addressCountry: 'SL',
  },
  sameAs: [FACEBOOK_URL],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable} antialiased`}>
        <a className="skip" href="#main">
          Skip to main content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}