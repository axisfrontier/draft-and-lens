'use client';

import { usePathname } from 'next/navigation';
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';

const LINKS: ReadonlyArray<{ href: string; label: string }> = [
  { href: '/about', label: 'About' },
  { href: '/glossary', label: 'Glossary' },
  { href: '/feedback', label: 'Feedback' },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      height: 'var(--nav-h)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 2.5rem',
      background: 'var(--black-band)',
      borderBottom: '2px solid var(--amber)',
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: '.95rem',
        letterSpacing: '.2em', textTransform: 'uppercase',
        color: 'var(--paper)', fontWeight: 500,
      }}>
        DRAFT<span style={{ color: 'var(--amber-l)' }}>&amp;</span>LENS
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'var(--font-mono)', fontSize: '.5rem',
                letterSpacing: '.12em', textTransform: 'uppercase',
                color: isActive ? 'var(--amber-l)' : 'var(--ink-faint)',
                textDecoration: 'none',
              }}
            >
              {link.label}
            </a>
          );
        })}
        <SignedOut>
          <SignInButton mode="modal">
            <button type="button" style={{
              fontFamily: 'var(--font-mono)', fontSize: '.58rem',
              letterSpacing: '.14em', textTransform: 'uppercase',
              padding: '.35rem .85rem', background: 'transparent',
              border: '1px solid var(--ink-mid)', color: 'var(--ink-faint)',
              cursor: 'pointer',
            }}>
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button type="button" style={{
              fontFamily: 'var(--font-mono)', fontSize: '.58rem',
              letterSpacing: '.14em', textTransform: 'uppercase',
              padding: '.35rem .85rem', background: 'var(--amber)',
              border: '1px solid var(--amber)', color: 'var(--black-band)',
              cursor: 'pointer', fontWeight: 500,
            }}>
              Create account
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <a href="/account" style={{
            fontFamily: 'var(--font-mono)', fontSize: '.5rem',
            letterSpacing: '.12em', textTransform: 'uppercase',
            color: pathname === '/account' ? 'var(--amber-l)' : 'var(--ink-faint)',
            textDecoration: 'none',
          }}>
            Your work
          </a>
          <UserButton />
        </SignedIn>
      </div>
    </header>
  );
}
