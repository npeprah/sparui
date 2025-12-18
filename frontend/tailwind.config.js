/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fireRed: '#FF4500',
        iceBlue: '#00BFFF',
        gold: '#FFD700',
        deepPurple: '#8B00FF',
        // Poker table theme
        feltGreen: '#0A5F38',
        woodTrim: '#4A2511',
        luxeGold: '#D4AF37',
      },
    },
  },
  plugins: [],
}
