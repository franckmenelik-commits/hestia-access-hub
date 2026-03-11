/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "hsl(15, 33%, 93%)",
          light: "hsl(30, 50%, 97%)",
          dark: "hsl(15, 20%, 88%)",
        },
        terracotta: {
          DEFAULT: "hsl(14, 68%, 63%)",
          light: "hsl(14, 68%, 73%)",
          dark: "hsl(14, 68%, 53%)",
        },
        sage: {
          DEFAULT: "hsl(155, 28%, 60%)",
          light: "hsl(155, 28%, 75%)",
          dark: "hsl(155, 28%, 45%)",
        },
        warm: {
          50: "hsl(30, 50%, 98%)",
          100: "hsl(30, 40%, 95%)",
          200: "hsl(20, 30%, 90%)",
          300: "hsl(15, 25%, 82%)",
          400: "hsl(15, 20%, 70%)",
          500: "hsl(15, 15%, 55%)",
          600: "hsl(15, 15%, 40%)",
          700: "hsl(15, 15%, 30%)",
          800: "hsl(15, 15%, 20%)",
          900: "hsl(15, 15%, 12%)",
        },
      },
      fontFamily: {
        serif: ["'DM Serif Display'", "Georgia", "serif"],
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0,0,0,0.07), 0 10px 20px -2px rgba(0,0,0,0.04)",
        card: "0 4px 25px -5px rgba(0,0,0,0.08)",
        elevated: "0 10px 40px -10px rgba(0,0,0,0.12)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "btn-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(224, 122, 95, 0)" },
          "50%": { boxShadow: "0 0 20px 2px rgba(224, 122, 95, 0.25)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out",
        "btn-glow": "btn-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
