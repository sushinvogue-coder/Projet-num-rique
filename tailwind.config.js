/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: { bg: '#0b0f19', card: '#121826', border: '#273148' },
      },
      boxShadow: { soft: '0 4px 20px rgba(0,0,0,0.25)' },
      borderRadius: { xl2: '1rem' },
    },
  },
  plugins: [],
};
