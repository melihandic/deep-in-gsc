/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        ink: {
          50:  '#f2f2f0',
          100: '#e4e4df',
          200: '#c9c9bf',
          300: '#aeae9f',
          400: '#93937f',
          500: '#78785f',
          600: '#5a5a47',
          700: '#3c3c2f',
          800: '#1e1e18',
          900: '#0f0f0c',
        },
        acid: {
          DEFAULT: '#c8f135',
          dark:    '#a3cc1a',
          light:   '#deff6e',
        },
        signal: {
          red:    '#ff4444',
          orange: '#ff8c00',
          green:  '#22c55e',
          blue:   '#3b82f6',
        }
      }
    }
  },
  plugins: []
}
