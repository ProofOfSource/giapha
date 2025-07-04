/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'border-amber-600',
    'border-blue-600',
    'border-green-600',
    'border-purple-600',
    'border-pink-600',
    'border-indigo-600',
    'grayscale',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
