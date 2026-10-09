/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // STRICT COMBO 2: #0C2C55, #629FAD, #EDEDCE
      colors: {
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
        'verification-green': {
          DEFAULT: '#629FAD',
          light: '#84BCC8',
          dark: '#477C88',
        },
        defence: {
          950: '#051326',
          900: '#0C2C55',
          850: '#0E3362',
          800: '#133D72',
          700: '#1D5399',
          border: '#629FAD',
          accent: '#629FAD',
        }
      },
      fontFamily: {
        serif: ['Instrument Serif', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'Menlo', 'monospace'],
        sans: ['"IBM Plex Sans"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'ink': '3px 3px 0px 0px #0C2C55',
        'ink-sm': '2px 2px 0px 0px #0C2C55',
        'ink-lg': '5px 5px 0px 0px #0C2C55',
        'defence-glow': '0 0 20px -5px rgba(98, 159, 173, 0.4)',
      }
    },
  },
  plugins: [],
}
