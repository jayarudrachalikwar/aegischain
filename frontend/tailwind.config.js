/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tempo: {
          bg: '#f3f3f3',
          surface: '#f0f0f0',
          tint: '#ebebeb',
          body: '#4d4d4d',
          accent: '#0d0d0d',
          dark: '#0d0d0d',
          pine: '#183030',
          border: '#c0c0c0',
          charcoal: '#484848',
          muted: '#909090',
        },
        parchment: {
          DEFAULT: '#EDEDCE',
          light: '#F8F8E7',
          dark: '#E2E2C0',
        },
        'bel-navy': {
          DEFAULT: '#0C2C55',
          dark: '#081D39',
          deep: '#051326',
          light: '#133D72',
        },
        'secure-black': '#0C2C55',
        'signal-red': {
          DEFAULT: '#0C2C55',
          hover: '#133D72',
          dark: '#081D39',
        },
        'muted-blue': {
          DEFAULT: '#629FAD',
          light: '#84BCC8',
          dark: '#477C88',
        },
        'warm-white': '#F8F8E7',
        defence: {
          950: '#051326',
          900: '#0C2C55',
          850: '#0E3362',
          800: '#133D72',
          700: '#1D5399',
          border: '#629FAD',
          accent: '#629FAD',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-1.92px',
        eyebrow: '0.08em',
      },
      lineHeight: {
        hero: '1',
      },
      boxShadow: {
        none: 'none',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        marquee: 'marquee 32s linear infinite',
        'marquee-fast': 'marquee 20s linear infinite',
        'pulse-subtle': 'pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
