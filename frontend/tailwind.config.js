/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        sb: {
          bg: "#0A0E1A",
          surface: "#111827",
          card: "#1A1F2E",
          border: "#1F2937",
          hover: "#252B3B",
          accent: "#3B82F6",
          accentHover: "#2563EB",
          accentMuted: "#1D4ED8",
          text: "#F9FAFB",
          textSecondary: "#9CA3AF",
          textMuted: "#6B7280",
        },
        risk: {
          low: "#10B981",
          lowBg: "rgba(16,185,129,0.08)",
          medium: "#F59E0B",
          mediumBg: "rgba(245,158,11,0.08)",
          high: "#F97316",
          highBg: "rgba(249,115,22,0.08)",
          critical: "#EF4444",
          criticalBg: "rgba(239,68,68,0.08)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "slide-in-right": "slideInRight 0.4s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "float": "float 6s ease-in-out infinite",
        "float-delayed": "float 8s ease-in-out 2s infinite",
        "gradient": "gradient 8s ease infinite",
        "gauge-fill": "gaugeFill 1.5s ease-out forwards",
        "counter": "counter 1.5s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        gradient: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        gaugeFill: {
          "0%": { strokeDashoffset: "283" },
        },
        counter: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};