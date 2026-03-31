import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0a0a0f",
          secondary: "#12121a",
          tertiary: "#1a1a26",
          card: "#14141e",
          hover: "#1e1e2e",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.04)",
          focus: "#6366f1",
        },
        accent: {
          DEFAULT: "#6366f1",
          hover: "#818cf8",
          soft: "rgba(99,102,241,0.08)",
        },
        accent2: {
          DEFAULT: "#06d6a0",
          soft: "rgba(6,214,160,0.08)",
        },
        text: {
          primary: "#f0f0f5",
          secondary: "#8888a0",
          tertiary: "#55556a",
        },
      },
      fontFamily: {
        sans: ["Outfit", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        card: "14px",
        button: "10px",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.4s ease both",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.4,0,0.2,1)",
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
