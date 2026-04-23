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
        // Micro-interaction keyframes
        "press": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(0.94)" },
          "100%": { transform: "scale(1)" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "60%": { transform: "scale(1.1)", opacity: "1" },
          "80%": { transform: "scale(0.96)" },
          "100%": { transform: "scale(1)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "ping-once": {
          "0%": { transform: "scale(1)", opacity: "1" },
          "75%": { transform: "scale(1.8)", opacity: "0" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-20px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(80px) rotate(360deg)", opacity: "0" },
        },
        "vote-pop": {
          "0%": { transform: "scale(1)" },
          "30%": { transform: "scale(1.35) rotate(-5deg)" },
          "60%": { transform: "scale(0.92) rotate(3deg)" },
          "100%": { transform: "scale(1) rotate(0deg)" },
        },
        "status-flash": {
          "0%": { opacity: "1" },
          "20%": { opacity: "0.3" },
          "40%": { opacity: "1" },
          "60%": { opacity: "0.3" },
          "100%": { opacity: "1" },
        },
        "check-draw": {
          "0%": { strokeDashoffset: "24" },
          "100%": { strokeDashoffset: "0" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "slide-down": "slide-down 0.3s ease-out forwards",
        "slide-in-right": "slide-in-right 0.3s ease-out forwards",
        // Micro-interactions
        "press": "press 0.2s ease-out",
        "bounce-in": "bounce-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards",
        "shimmer": "shimmer 1.8s linear infinite",
        "ping-once": "ping-once 0.5s ease-out forwards",
        "confetti-fall": "confetti-fall 0.8s ease-out forwards",
        "vote-pop": "vote-pop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        "status-flash": "status-flash 0.6s ease-in-out",
        "check-draw": "check-draw 0.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
