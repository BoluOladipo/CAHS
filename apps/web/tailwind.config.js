/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14221A",
        forest: "#1B4332",
        leaf: "#2D6A4F",
        moss: "#40916C",
        cream: "#F4F1E8",
        sand: "#E7E1D1",
        clay: "#C4662A",
        gold: "#C9A227",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Figtree", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
