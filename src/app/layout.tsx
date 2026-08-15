import type { Metadata, Viewport } from 'next';
import { Inter, Instrument_Serif, IBM_Plex_Mono } from 'next/font/google';
import { profile } from '@/data/resume';
import { getSiteUrl } from '@/lib/site-url';
import { SmoothScroll } from '@/components/layout/smooth-scroll';
import './globals.css';

/* Editorial trio: serif for display, sans for reading, mono for metadata. */
const sans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  // Absolute base so Open Graph URLs resolve correctly once deployed.
  metadataBase: new URL(getSiteUrl()),
  title: `${profile.name} — ${profile.title}`,
  description: profile.summary,
  authors: [{ name: profile.name }],
  keywords: [
    'Akshat Verma',
    'Data Science',
    'UC Davis',
    'Statistical Modelling',
    'Data Analysis',
    'Machine Learning',
  ],
  openGraph: {
    title: `${profile.name} — ${profile.title}`,
    description: profile.summary,
    type: 'profile',
    locale: 'en_US',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#07111F',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      {/* Browser extensions (Grammarly and friends) write attributes onto
          <body> before React hydrates; suppressHydrationWarning only applies
          one level deep, so <body> needs its own. */}
      <body suppressHydrationWarning>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-[100] focus:bg-navy-700 focus:px-4 focus:py-2 focus:text-beige-200"
        >
          Skip to content
        </a>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
