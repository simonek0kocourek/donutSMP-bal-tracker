import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        navy: "#0a0f1e",
        violet: {
          accent: "#7c3aed",
          line: "#a78bfa",
          deep: "#4c1d95",
        },
        charcoal: {
          accent: "#6b7280",
          line: "#e5e7eb",
          deep: "#1f2937",
        },
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-open": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(251, 146, 60, 0.7)" },
          "50%": { boxShadow: "0 0 0 8px rgba(251, 146, 60, 0)" },
        },
        "grain-shift": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "25%": { transform: "translate(-2%, 1%)" },
          "50%": { transform: "translate(1%, -2%)" },
          "75%": { transform: "translate(-1%, 2%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out forwards",
        "scale-in": "scale-in 0.25s ease-out forwards",
        "pulse-open": "pulse-open 1.8s ease-in-out infinite",
        "grain-shift": "grain-shift 8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
