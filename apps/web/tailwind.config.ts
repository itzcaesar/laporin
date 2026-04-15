// ── tailwind.config.ts ──
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#1A3C6E",
        blue: {
          DEFAULT: "#2563EB",
          light: "#DBEAFE",
        },
        teal: {
          DEFAULT: "#0F766E",
          light: "#CCFBF1",
        },
        ink: "#111827",
        muted: "#6B7280",
        surface: "#F9FAFB",
        card: "#FFFFFF",
        border: "#E5E7EB",
        status: {
          new: "#F59E0B",
          verified: "#3B82F6",
          progress: "#F97316",
          done: "#10B981",
          verified_complete: "#065F46",
          rejected: "#DC2626",
          disputed: "#9F1239",
          urgent: "#DC2626",
        },
        priority: {
          low: "#6B7280",
          medium: "#F59E0B",
          high: "#F97316",
          urgent: "#DC2626",
        },
      },
      fontFamily: {
        display: ["var(--font-jakarta)", "sans-serif"],
        body: ["var(--font-dm)", "sans-serif"],
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-down": {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(100%)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "slide-down": "slide-down 0.3s ease-out forwards",
        "slide-in-right": "slide-in-right 0.3s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
