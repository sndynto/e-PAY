/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#090B0A',
        surface: '#111512',
        elevated: '#171B18',
        border: '#272D28',
        accent: '#C7FF4A',
        'accent-dim': '#A8D93E',
        primary: '#F4F6F2',
        secondary: '#929B92',
        success: '#65DB91',
        warning: '#FFC66D',
        danger: '#FF7777',
        'surface-hover': '#1A1F1B',
        'elevated-hover': '#1E2420',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', '"DM Mono"', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Tighter tracking at larger sizes, normal at small
        '2xs': ['0.625rem', { lineHeight: '1rem', letterSpacing: '0.04em' }],
        xs:    ['0.75rem',  { lineHeight: '1.125rem' }],
        sm:    ['0.8125rem',{ lineHeight: '1.25rem' }],
        base:  ['0.9375rem',{ lineHeight: '1.5rem' }],
        lg:    ['1rem',     { lineHeight: '1.5rem',   letterSpacing: '-0.01em' }],
        xl:    ['1.125rem', { lineHeight: '1.5rem',   letterSpacing: '-0.015em' }],
        '2xl': ['1.375rem', { lineHeight: '1.75rem',  letterSpacing: '-0.02em' }],
        '3xl': ['1.75rem',  { lineHeight: '2rem',     letterSpacing: '-0.025em' }],
        '4xl': ['2.25rem',  { lineHeight: '2.5rem',   letterSpacing: '-0.03em' }],
      },
      letterSpacing: {
        tight:   '-0.02em',
        tighter: '-0.025em',
        widest:  '0.1em',
      },
      borderRadius: {
        DEFAULT: '0.375rem',
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.625rem',
        '2xl': '0.75rem',
        '3xl': '1rem',
        full: '9999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4)',
        'card-hover': '0 2px 8px rgba(0,0,0,0.5)',
      },
      transitionDuration: {
        // Micro-interactions
        '100': '100ms',
        '120': '120ms',
        '150': '150ms',
        // Component transitions
        '200': '200ms',
        '220': '220ms',
        '250': '250ms',
      },
      transitionTimingFunction: {
        'ease-out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
        'ease-in-out-quart': 'cubic-bezier(0.76, 0, 0.24, 1)',
      },
      animation: {
        'fade-up': 'fadeUp 0.22s cubic-bezier(0.25, 1, 0.5, 1) both',
        'fade-in': 'fadeIn 0.18s ease-out both',
        'slide-in-up': 'slideInUp 0.22s cubic-bezier(0.25, 1, 0.5, 1) both',
        'slide-in-right': 'slideInRight 0.20s cubic-bezier(0.25, 1, 0.5, 1) both',
        'pulse-dot': 'pulseDot 2.4s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
        'spin-slow': 'spin 1s linear infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideInUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1',   transform: 'scale(1)' },
          '50%':      { opacity: '0.4', transform: 'scale(0.8)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
    },
  },
  plugins: [],
}
