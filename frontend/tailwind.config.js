/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#253247',
          50: '#F5F7FB',
          100: '#E8ECF4',
          200: '#C9D4E6',
          300: '#9FB3D1',
          400: '#6B8BB5',
          500: '#436894',
          600: '#2F4B6F',
          700: '#253247', // Primary Brand Navy
          800: '#1C2636',
          900: '#121924',
        },
        indigo: {
          DEFAULT: '#596FE0',
          50: '#EEF1FC',
          100: '#DCE2FA',
          500: '#596FE0', // Secondary Brand Indigo
          600: '#475DC8',
          700: '#384AB0',
        },
        gold: {
          DEFAULT: '#D4AF72',
          50: '#FAF6ED',
          100: '#F5EDDC',
          400: '#E0C592',
          500: '#D4AF72', // Luxury Accent Gold
          600: '#BF9853',
          700: '#9E7936',
        },
        canvas: '#F5F7FB',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 10px -2px rgba(37, 50, 71, 0.05), 0 4px 20px -2px rgba(37, 50, 71, 0.05)',
        'card-hover': '0 8px 25px -4px rgba(37, 50, 71, 0.1), 0 6px 16px -4px rgba(37, 50, 71, 0.06)',
      }
    },
  },
  plugins: [],
}
