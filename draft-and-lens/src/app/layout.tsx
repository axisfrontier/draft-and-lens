import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';
import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans, Libre_Baskerville } from 'next/font/google';

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
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
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
          <header style={{
            position: ‘sticky’, top: 0, zIndex: 100,
            height: ‘var(--nav-h)’,
            display: ‘flex’, alignItems: ‘center’, justifyContent: ‘space-between’,
            padding: ‘0 2.5rem’,
            background: ‘var(--black-band)’,
            borderBottom: ‘2px solid var(--amber)’,
          }}>
            {/* Logo */}
            <span style={{
              fontFamily: ‘var(--font-mono)’, fontSize: ‘.95rem’,
              letterSpacing: ‘.2em’, textTransform: ‘uppercase’,
              color: ‘var(--paper)’, fontWeight: 500,
            }}>
              DRAFT<span style={{ color: ‘var(--amber-l)’ }}>&amp;</span>LENS
            </span>

            {/* Right nav */}
            <div style={{ display: ‘flex’, alignItems: ‘center’, gap: ‘1.5rem’ }}>
              <a href="/glossary" style={{
                fontFamily: ‘var(--font-mono)’, fontSize: ‘.5rem’,
                letterSpacing: ‘.12em’, textTransform: ‘uppercase’,
                color: ‘var(--ink-faint)’, textDecoration: ‘none’,
              }}>
                Glossary
              </a>
              <SignedOut>
                <SignInButton mode="modal">
                  <button type="button" style={{
                    fontFamily: ‘var(--font-mono)’, fontSize: ‘.58rem’,
                    letterSpacing: ‘.14em’, textTransform: ‘uppercase’,
                    padding: ‘.35rem .85rem’, background: ‘transparent’,
                    border: ‘1px solid var(--ink-mid)’, color: ‘var(--ink-faint)’,
                    cursor: ‘pointer’,
                  }}>
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button type="button" style={{
                    fontFamily: ‘var(--font-mono)’, fontSize: ‘.58rem’,
                    letterSpacing: ‘.14em’, textTransform: ‘uppercase’,
                    padding: ‘.35rem .85rem’, background: ‘var(--amber)’,
                    border: ‘1px solid var(--amber)’, color: ‘var(--black-band)’,
                    cursor: ‘pointer’, fontWeight: 500,
                  }}>
                    Create account
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <a href="/account" style={{
                  fontFamily: ‘var(--font-mono)’, fontSize: ‘.5rem’,
                  letterSpacing: ‘.12em’, textTransform: ‘uppercase’,
                  color: ‘var(--ink-faint)’, textDecoration: ‘none’,
                }}>
                  Your work
                </a>
                <UserButton />
              </SignedIn>
            </div>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
