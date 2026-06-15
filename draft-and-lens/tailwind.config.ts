import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        cream: 'var(--cream)',
        'warm-mid': 'var(--warm-mid)',
        rule: 'var(--rule)',
        'rule-l': 'var(--rule-l)',
        ink: 'var(--ink)',
        'ink-mid': 'var(--ink-mid)',
        'ink-soft': 'var(--ink-soft)',
        'ink-faint': 'var(--ink-faint)',
        amber: 'var(--amber)',
        'amber-d': 'var(--amber-d)',
        'amber-l': 'var(--amber-l)',
        red: 'var(--red)',
        green: 'var(--green)',
        teal: 'var(--teal)',
        blue: 'var(--blue)',
        tension: 'var(--tension)',
        pace: 'var(--pace)',
        emotion: 'var(--emotion)',
        'black-band': 'var(--black-band)',
        'surface-input': 'var(--surface-input)',
        'surface-deep': 'var(--surface-deep)',
        'border-dark': 'var(--border-dark)',
        'border-deeper': 'var(--border-deeper)',
        error: 'var(--error)',
        success: 'var(--success)',
        'paper-dark': 'var(--paper-dark)',
        'label-amber': 'var(--label-amber)',
      },
      spacing: {
        nav: 'var(--nav-h)',
        sidebar: 'var(--sidebar-w)',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Libre Baskerville', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
