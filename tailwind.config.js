/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF5A1F',
          dark: '#E04009',
          light: '#FF8F6B'
        },
        secondary: {
          DEFAULT: '#1F2937',
          dark: '#111827',
          light: '#374151'
        },
        background: {
          DEFAULT: '#0F172A',
          dark: '#0A0F1D',
          card: '#1E293B'
        },
        text: {
          primary: '#F3F4F6',
          secondary: '#9CA3AF',
          muted: '#6B7280'
        },
        white: '#FFFFFF',
        gray: {
          100: '#F3F4F6',
          500: '#6B7280',
          900: '#111827'
        },
        accent: {
          500: '#FF5A1F'
        }
      },
      fontFamily: {
        sans: ['Inter var', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif']
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}