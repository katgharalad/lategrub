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
          DEFAULT: '#FF6B6B',
          dark: '#FF5252',
          light: '#FF8585'
        },
        secondary: {
          DEFAULT: '#1F2937',
          dark: '#111827',
          light: '#374151'
        },
        background: {
          DEFAULT: '#1A1B1E',
          dark: '#141517',
          card: '#25262B'
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#909296',
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
        display: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'bounce': 'bounce 0.5s ease-in-out',
        'ping': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in',
        'scale': 'scale 0.3s ease-in-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        bounce: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scale: {
          '0%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      boxShadow: {
        'float': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'glow': '0 0 20px rgba(255, 107, 107, 0.4)',
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(45deg, #FF6B6B 0%, #FF8585 100%)',
      },
    },
  },
  plugins: [],
}