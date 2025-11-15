/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/shared/**/*.{js,ts,jsx,tsx}",
    "./src/features/**/*.{js,ts,jsx,tsx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        popover: "hsl(var(--popover))",
        "popover-foreground": "hsl(var(--popover-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        destructive: "hsl(var(--destructive))",
        "destructive-foreground": "hsl(var(--destructive-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        // 🎨 إضافات عالمية
        brand: {
          DEFAULT: "hsl(220 60% 45%)",
          light: "hsl(220 80% 60%)",
          dark: "hsl(220 50% 35%)",
        },
        success: {
          DEFAULT: "hsl(142 70% 45%)",
          foreground: "hsl(0 0% 100%)",
        },
        warning: {
          DEFAULT: "hsl(38 92% 50%)",
          foreground: "hsl(0 0% 100%)",
        },
        info: {
          DEFAULT: "hsl(199 89% 48%)",
          foreground: "hsl(0 0% 100%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      container: {
        center: true,
        padding: "1.5rem",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: 0 },
          "100%": { transform: "translateY(0)", opacity: 1 },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-in-out",
        slideUp: "slideUp 0.6s ease-out",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        "sans-ar": ["Cairo", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        tighter: "-0.02em",
        wide: "0.02em",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
