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
          DEFAULT: '#A6192E',
          dark: '#8A1526',
          light: '#C41D35'
        },
        secondary: {
          DEFAULT: '#54585A',
          dark: '#3A3D3E',
          light: '#6E7376'
        },
        background: {
          DEFAULT: '#000000',
          dark: '#141414',
          card: '#1A1A1A'
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#E0E0E0',
          muted: '#909296'
        },
        white: '#FFFFFF',
        gray: {
          100: '#E0E0E0',
          500: '#54585A',
          900: '#000000'
        },
        accent: {
          500: '#A6192E'
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
        'float': '0 4px 30px rgba(0, 0, 0, 0.3)',
        'glow': '0 0 20px rgba(166, 25, 46, 0.3)',
      },
      backgroundImage: {
        'gradient-accent': 'linear-gradient(45deg, #A6192E 0%, #C41D35 100%)',
      },
    },
  },
  plugins: [],
}