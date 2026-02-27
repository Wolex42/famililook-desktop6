/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#5e5ce6",
        accent: "#0a84ff",
        // Dark surface hierarchy (Material dark theme pattern)
        surface: {
          0: "#0A0A0F",
          1: "#161620",
          2: "#1E1E2E",
          3: "#282838",
          DEFAULT: "#1a1a2e",
        },
        "surface-light": "#2a2a3e",
        "text-secondary": "rgba(255,255,255,0.6)",
        "text-muted": "rgba(255,255,255,0.35)",
      },
      backgroundImage: {
        "gradient-violet-pink": "linear-gradient(135deg, #0a84ff 0%, #5e5ce6 100%)",
        "gradient-gold": "linear-gradient(135deg, #0a84ff 0%, #5e5ce6 100%)",
        "gradient-cosmic": "linear-gradient(180deg, #0A0A0F 0%, #0D0D20 50%, #0A0A0F 100%)",
      },
      backdropBlur: {
        xs: "4px",
      },
      boxShadow: {
        "glow-violet": "0 0 40px rgba(94,92,230,0.35)",
        "glow-pink": "0 0 40px rgba(10,132,255,0.35)",
        "glow-gold": "0 0 30px rgba(94,92,230,0.30)",
        "card": "0 8px 32px rgba(0,0,0,0.40)",
      },
      animation: {
        "pulse-slow": "pulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
        "fade-up": "fadeUp 0.4s ease-out forwards",
        "dot-bounce": "dotBounce 1.4s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(12px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        dotBounce: {
          "0%, 80%, 100%": { transform: "scale(0.6)", opacity: 0.4 },
          "40%": { transform: "scale(1)", opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
