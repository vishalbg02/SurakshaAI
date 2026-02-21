/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        suraksha: {
          dark: "#0F172A",
          card: "#1E293B",
          border: "#334155",
          accent: "#3B82F6",
          green: "#22C55E",
          yellow: "#EAB308",
          orange: "#F97316",
          red: "#EF4444",
          critical: "#A855F7",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};