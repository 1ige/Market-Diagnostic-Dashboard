/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        'stealth': {
          '700': '#2d3748',
          '750': '#232936',
          '800': '#1a202c',
          '850': '#181e29',
          '900': '#171923',
        },
        'accent': {
          'green': '#48bb78',
          'yellow': '#ecc94b',
          'red': '#f56565',
        },
        'pulse': {
          '400': '#60a5fa',
        }
      }
    },
  },
  plugins: [],
}
