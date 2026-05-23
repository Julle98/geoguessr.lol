/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        /* keep old names so existing game components don't break */
        earth: {
          900: '#07021a',
          800: '#0c0526',
          700: '#150a36',
          600: '#1d1248',
          500: '#261566',
        },
        accent: {
          green:   '#00f0ff',
          lime:    '#ff2d95',
          gold:    '#ffd60a',
          magenta: '#ff2d95',
          cyan:    '#00f0ff',
          amber:   '#ffd60a',
          violet:  '#b14dff',
          coral:   '#ff6b35',
        },
        neon: {
          magenta: '#ff2d95',
          cyan:    '#00f0ff',
          amber:   '#ffd60a',
          violet:  '#b14dff',
          coral:   '#ff6b35',
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'score-pop': 'scorePop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scorePop: {
          from: { transform: 'scale(0.5)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
