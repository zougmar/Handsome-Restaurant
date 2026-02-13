/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: '#1a1a1a',
          gold: '#d4af37',
          warm: '#c9a961',
        },
        restaurant: {
          dark: '#0f0f0f',
          gold: '#d4af37',
          lightGold: '#f4e4bc',
          warm: '#8b7355',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
