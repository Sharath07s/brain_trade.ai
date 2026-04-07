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
        background: '#0a0a0f',
        panel: '#13141f',
        accent: '#00f0ff',
        accent_hover: '#00c3d9',
        bullish: '#00ff88',
        bearish: '#ff3366',
        neutral: '#8892b0'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
