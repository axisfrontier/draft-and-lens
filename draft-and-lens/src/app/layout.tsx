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
          <header className="flex items-center justify-end gap-3 border-b border-rule-l bg-paper px-8 py-3 text-sm">
            <SignedOut>
              <SignInButton mode="modal">
                <button type="button" className="rounded border border-ink-soft px-3 py-1.5 text-ink">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button type="button" className="rounded bg-ink px-3 py-1.5 text-paper">
                  Create account
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <a href="/account" className="text-ink-soft hover:text-ink">
                Your work
              </a>
              <UserButton />
            </SignedIn>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
