/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/src/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./*.tsx",
    "./index.html",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#e8edf5",
          100: "#d1daea",
          500: "#2ab5c1",
          600: "#1a2a5e",
          700: "#141f47",
        },
      },
    },
  },
  plugins: [],
};
