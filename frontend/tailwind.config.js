/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          bg: "#F5F7FA",
          navy: "#0B3D91",
          accent: "#1A73E8",
          text: "#1F2937",
          border: "#E5E7EB",
          card: "#FFFFFF",
          muted: "#6B7280",
        },
        risk: {
          low: "#2E7D32",
          medium: "#F9A825",
          high: "#EF6C00",
          critical: "#C62828",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};