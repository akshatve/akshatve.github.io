import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  future: { hoverOnlyWhenSupported: true },
  theme: {
    container: { center: true },
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'ui-serif', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        /* Deep navy ground, warm beige ink. Nothing else. */
        navy: {
          900: '#050D18',
          800: '#07111F',
          700: '#0B1728',
          600: '#101F33',
          500: '#16293F',
        },
        beige: {
          100: '#F3ECDC',
          200: '#E8DEC8',
          300: '#C9BEA4',
          400: '#9A9179',
          500: '#6E6857',
        },
        /** Used very sparingly — single accent. */
        gold: '#D8C08A',
      },
      letterSpacing: {
        metadata: '0.28em',
        wide2: '0.16em',
      },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.22, 1, 0.36, 1)',
        smooth: 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      keyframes: {
        'grain-shift': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(-2%, 1%)' },
          '50%': { transform: 'translate(1%, -2%)' },
          '75%': { transform: 'translate(2%, 2%)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -18px, 0)' },
        },
      },
      animation: {
        'grain-shift': 'grain-shift 8s steps(4, end) infinite',
        drift: 'drift 14s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
