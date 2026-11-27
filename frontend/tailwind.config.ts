import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      borderRadius: { xl: "0.875rem", "2xl": "1.125rem" },
      boxShadow: { card: "0 12px 32px hsl(var(--shadow) / 0.08)" },
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        surface: "hsl(var(--surface) / <alpha-value>)",
        card: "hsl(var(--card) / <alpha-value>)",
        muted: "hsl(var(--muted) / <alpha-value>)",
        "muted-foreground": "hsl(var(--muted-foreground) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        primary: { DEFAULT: "hsl(var(--primary) / <alpha-value>)", foreground: "hsl(var(--primary-foreground) / <alpha-value>)" },
        success: { DEFAULT: "hsl(var(--success) / <alpha-value>)", foreground: "hsl(var(--success-foreground) / <alpha-value>)" },
        warning: { DEFAULT: "hsl(var(--warning) / <alpha-value>)", foreground: "hsl(var(--warning-foreground) / <alpha-value>)" },
        danger: { DEFAULT: "hsl(var(--danger) / <alpha-value>)", foreground: "hsl(var(--danger-foreground) / <alpha-value>)" }
      }
    }
  },
  plugins: []
};

export default config;
