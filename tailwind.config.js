/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#0a84ff',
          indigo: '#5e5ce6',
        },
      },
    },
  },
  plugins: [],
};
