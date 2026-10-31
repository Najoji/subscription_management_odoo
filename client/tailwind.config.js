/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Premium charcoal scale (neutral black, subtle warm undertone)
        slate: {
          50: '#f5f5f7',
          100: '#ececf0',
          200: '#d4d4da',
          300: '#b3b3bc',
          400: '#8c8c97',
          500: '#6b6b76',
          600: '#4a4a53',
          700: '#2f2f36',
          800: '#202025',
          900: '#141417',
          950: '#0a0a0c',
        },
        // Brand accent: ember orange
        indigo: {
          50: '#fff3ec',
          100: '#ffe3d2',
          200: '#ffc5a3',
          300: '#ffa06b',
          400: '#ff7d3a',
          500: '#ff5e1a',
          600: '#f04a08',
          700: '#c93a06',
          800: '#8f2a06',
          900: '#4a1604',
          950: '#2a0c02',
        },
        // Secondary accent: soft pink (forecast line)
        violet: {
          400: '#f78ec5',
          500: '#f06bb0',
          600: '#d9509a',
        },
        primary: {
          50: '#fff3ec',
          100: '#ffe3d2',
          500: '#ff5e1a',
          600: '#f04a08',
          700: '#c93a06',
        },
      },
      boxShadow: {
        glow: '0 0 24px rgba(255, 94, 26, 0.25)',
      },
    },
  },
  plugins: [],
}
