/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        serif: ['DM Serif Display', 'Georgia', 'serif'],
      },
      colors: {
        bg: {
          DEFAULT: '#0D1117',
          surface: '#161B22',
          raised: '#1C2128',
        },
        border: {
          DEFAULT: '#30363D',
          muted: '#21262D',
        },
        ink: {
          DEFAULT: '#E6EDF3',
          muted: '#8B949E',
          subtle: '#484F58',
        },
        brand: {
          DEFAULT: '#238636',
          hover: '#2EA043',
          teal: '#1A7F64',
        },
        risk: {
          low: { DEFAULT: '#2EA043', bg: '#0D2119', text: '#56D364' },
          medium: { DEFAULT: '#D29922', bg: '#1C1700', text: '#E3B341' },
          high: { DEFAULT: '#DA3633', bg: '#1C0A09', text: '#F85149' },
          critical: { DEFAULT: '#8B0000', bg: '#160000', text: '#FF6B6B' },
        },
        info: { DEFAULT: '#1F6FEB', bg: '#051D4D', text: '#58A6FF' },
        purple: { DEFAULT: '#6E40C9', bg: '#1A0F2E', text: '#A5A5FF' },
      },
      borderRadius: {
        card: '12px',
        pill: '9999px',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
