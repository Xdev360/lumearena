import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        green:   '#003E31',
        lime:    '#BEFF00',
        surface: '#0C0C0C',
        border:  '#1A1A1A',
        muted:   '#3A3A3A',
        dim:     '#666666',
      },
      fontFamily: {
        display: ['"Arial Black"', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        body:    ['system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px', md: '10px', lg: '16px', xl: '24px',
      },
      animation: {
        'fade-up':    'fadeUp .6s ease forwards',
        'fade-in':    'fadeIn .4s ease forwards',
        'pulse-lime': 'pulse-lime 2s ease-in-out infinite',
        'ticker':     'ticker 20s linear infinite',
      },
    },
  },
  plugins: [],
}
export default config
