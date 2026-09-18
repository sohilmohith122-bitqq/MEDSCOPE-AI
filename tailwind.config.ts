import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        clinical: {
          50: "#edfafa", 100: "#d5f5f6", 200: "#aaeaec", 300: "#6dd8db",
          400: "#2cbfc4", 500: "#0e9fa4", 600: "#0b7f84", 700: "#0a6568",
          800: "#0c5254", 900: "#0e4244", 950: "#052a2c",
        },
        surface: {
          DEFAULT: "#0f1117", 50: "#f8fafc", 100: "#f1f5f9",
          800: "#1a1f2e", 900: "#0f1117", 950: "#080b10",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "mesh-clinical": "radial-gradient(at 40% 20%, hsla(183,85%,20%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,0.05) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(183,85%,15%,0.1) 0px, transparent 50%)",
      },
      boxShadow: {
        "glass": "0 4px 24px -4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
        "glass-sm": "0 2px 12px -2px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)",
        "glow-clinical": "0 0 20px rgba(14,159,164,0.25)",
        "glow-red": "0 0 20px rgba(239,68,68,0.3)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.35s cubic-bezier(0.16,1,0.3,1)",
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "shimmer": "shimmer 1.8s linear infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        shimmer: { from: { backgroundPosition: "-200% 0" }, to: { backgroundPosition: "200% 0" } },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
