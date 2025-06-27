import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Monaco",
          "Cascadia Code",
          "Roboto Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Consolas",
          "Liberation Mono",
          "Menlo",
          "monospace",
        ],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Catppuccin Mocha colors
        "ctp-base": "#1e1e2e",
        "ctp-mantle": "#181825",
        "ctp-crust": "#11111b",
        "ctp-surface0": "#313244",
        "ctp-surface1": "#45475a",
        "ctp-surface2": "#585b70",
        "ctp-overlay0": "#6c7086",
        "ctp-overlay1": "#7f849c",
        "ctp-overlay2": "#9399b2",
        "ctp-subtext0": "#a6adc8",
        "ctp-subtext1": "#bac2de",
        "ctp-text": "#cdd6f4",
        "ctp-lavender": "#b4befe",
        "ctp-blue": "#89b4fa",
        "ctp-sapphire": "#74c7ec",
        "ctp-sky": "#89dceb",
        "ctp-teal": "#94e2d5",
        "ctp-green": "#a6e3a1",
        "ctp-yellow": "#f9e2af",
        "ctp-peach": "#fab387",
        "ctp-maroon": "#eba0ac",
        "ctp-red": "#f38ba8",
        "ctp-mauve": "#cba6f7",
        "ctp-pink": "#f5c2e7",
        "ctp-flamingo": "#f2cdcd",
        "ctp-rosewater": "#f5e0dc",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
