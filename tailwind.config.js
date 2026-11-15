/** @type {import('tailwindcss').Config} */
module.exports = {
  // Enable dark mode via a "dark" class on <html>
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      // ── Design tokens ──────────────────────────────────────────────
      colors: {
        // Primary: indigo → violet gradient stops
        primary: {
          50:  "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        // Accent violet
        violet: {
          500: "#8b5cf6",
          600: "#7c3aed",
        },
        // Success / progress – emerald/teal
        success: {
          50:  "#ecfdf5",
          100: "#d1fae5",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
        // Warning – amber
        warning: {
          50:  "#fffbeb",
          100: "#fef3c7",
          500: "#f59e0b",
          600: "#d97706",
        },
        // Error – rose
        danger: {
          50:  "#fff1f2",
          100: "#ffe4e6",
          500: "#f43f5e",
          600: "#e11d48",
        },
      },
      // Font family (Inter loaded via next/font, applied via CSS variable)
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      // Heading scale
      fontSize: {
        "display-2xl": ["4.5rem",  { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-xl":  ["3.75rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-lg":  ["3rem",    { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "display-md":  ["2.25rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        "display-sm":  ["1.875rem",{ lineHeight: "1.2" }],
      },
      // Border radius
      borderRadius: {
        "2xl":  "1rem",
        "3xl":  "1.5rem",
        "4xl":  "2rem",
      },
      // Box shadows
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,.07), 0 1px 2px -1px rgba(0,0,0,.07)",
        "card-hover": "0 10px 25px -5px rgba(99,102,241,.18), 0 4px 10px -6px rgba(99,102,241,.12)",
        glow: "0 0 20px rgba(99,102,241,.35)",
      },
      // Gradient backgrounds as bg utilities
      backgroundImage: {
        "gradient-primary":   "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
        "gradient-primary-h": "linear-gradient(135deg, #4338ca 0%, #6d28d9 100%)",
        "gradient-hero":      "linear-gradient(135deg, #eef2ff 0%, #f5f3ff 50%, #ecfdf5 100%)",
        "gradient-hero-dark": "linear-gradient(135deg, #1e1b4b 0%, #1e0a3c 50%, #022c22 100%)",
      },
      // Animation keyframes
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-468px 0" },
          "100%": { backgroundPosition: "468px 0"  },
        },
        "fade-up": {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)"    },
        },
        "scale-in": {
          "0%":   { opacity: "0", transform: "scale(.95)" },
          "100%": { opacity: "1", transform: "scale(1)"   },
        },
        blob: {
          "0%, 100%": { transform: "translate(0,0) scale(1)"            },
          "33%":      { transform: "translate(30px,-50px) scale(1.1)"   },
          "66%":      { transform: "translate(-20px,20px) scale(.9)"    },
        },
      },
      animation: {
        shimmer:  "shimmer 1.5s infinite linear",
        "fade-up":"fade-up .5s ease-out forwards",
        "scale-in":"scale-in .2s ease-out forwards",
        blob:     "blob 7s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};

