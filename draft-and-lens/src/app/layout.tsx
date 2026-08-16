import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans, Libre_Baskerville } from 'next/font/google';

import { SiteNav } from '@/components/nav/SiteNav';

import './globals.css';

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  // 300 dropped 2026-08-16: zero usages in the app. Every declared variant is
  // a font file the browser may fetch, and each one is fetched lazily on first
  // use, so keeping unused weights only costs payload. 400 and 500 are both in
  // real use (body copy, and font-medium / the ex-600 sites).
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  // 300 dropped 2026-08-16: zero usages, same reasoning as the sans above.
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Draft & Lens',
  description: 'Tradition-aware editorial analysis for scripts, treatments, stories, and stage plays.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en-GB"
        className={`${libreBaskerville.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
      >
        <body>
          {/* Disable browser scroll restoration before first paint */}
          <script dangerouslySetInnerHTML={{ __html: `history.scrollRestoration='manual';window.scrollTo(0,0);` }} />
          <SiteNav />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
