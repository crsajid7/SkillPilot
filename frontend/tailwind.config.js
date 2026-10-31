/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#08090B',
        surface: {
          1: '#0D0F12',
          2: '#111317',
          3: '#181B20',
        },
        border: {
          subtle: '#24272D',
          hover: '#343840',
        },
        text: {
          primary: '#F2F3F5',
          secondary: '#90949E',
          muted: '#636773',
        },
        accent: {
          lime: '#C8FF55',
          'lime-dim': 'rgba(200, 255, 85, 0.15)',
          'lime-border': 'rgba(200, 255, 85, 0.3)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '10px',
        sm: '8px',
        md: '10px',
        lg: '12px',
        xl: '14px',
      },
    },
  },
  plugins: [],
}
