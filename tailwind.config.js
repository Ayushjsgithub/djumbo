/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        oled: {
          black: '#000000',
          950: '#050505',
          900: '#0a0a0a',
          850: '#111111',
          800: '#171717',
          750: '#1f1f1f',
          700: '#262626',
          600: '#404040',
          500: '#737373',
          400: '#a3a3a3',
          300: '#d4d4d4',
          200: '#e5e5e5',
          100: '#f5f5f5',
          white: '#ffffff',
        },
        deckA: {
          DEFAULT: '#ffffff',
          dim: '#a1a1aa',
          border: '#3f3f46',
        },
        deckB: {
          DEFAULT: '#e4e4e7',
          dim: '#71717a',
          border: '#3f3f46',
        }
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'oled-card': '0 4px 20px rgba(0, 0, 0, 0.95)',
        'oled-inset': 'inset 0 2px 4px rgba(0, 0, 0, 0.8)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [],
};
