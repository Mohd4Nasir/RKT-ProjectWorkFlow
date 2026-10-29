import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: "hsl(var(--surface))",

        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)", // supports bg-primary/10 ... bg-primary/90
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
          soft: "hsl(var(--primary-soft))",
          55: "hsl(var(--primary) / 0.33)", // fixed 33% tint, no separate variable needed
        },

        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground))",
          55: "hsl(var(--secondary) / 0.33)",
        },

        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground))",
          55: "hsl(var(--accent) / 0.33)",
        },

        heading: {
          DEFAULT: "hsl(var(--heading) / <alpha-value>)",
          55: "hsl(var(--heading) / 0.33)",
        },

        paragraph: {
          DEFAULT: "hsl(var(--paragraph) / <alpha-value>)",
          55: "hsl(var(--paragraph) / 0.33)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          foreground: "hsl(var(--danger-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        brand: {
          accent: "hsl(var(--brand-accent) / <alpha-value>)",
          "accent-strong": "hsl(var(--brand-accent-strong) / <alpha-value>)",
          line: "hsl(var(--brand-line) / <alpha-value>)",
          surface: "hsl(var(--brand-surface) / <alpha-value>)",
          cta: "hsl(var(--brand-cta) / <alpha-value>)",
        },
      },
      backgroundImage: {
        "gradient-primary": "var(--gradient-primary)",
        "gradient-soft": "var(--gradient-soft)",
        "gradient-success": "var(--gradient-success)",
      },
      boxShadow: {
        soft: "var(--shadow-sm)",
        card: "var(--shadow)",
        elevated: "var(--shadow-md)",
        lifted: "var(--shadow-lg)",
        glow: "var(--shadow-glow)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(20px)", opacity: "0" },
          to: { transform: "translateX(0)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
