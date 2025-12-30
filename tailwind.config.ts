import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/streamdown/dist/*.js",
  ],
  theme: {
    fontFamily: {
      sans: ["var(--tttr-font-primary)", "geist", "sans-serif"],
      mono: ["geist-mono", "monospace"],
      // TTTR Design System Fonts (from Figma)
      primary: ["var(--tttr-font-primary)", "sans-serif"],
      secondary: ["var(--tttr-font-secondary)", "sans-serif"],
    },
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // TTTR Design System Radius (from Figma)
        "tttr-4": "var(--tttr-radius-4)",
        "tttr-8": "var(--tttr-radius-8)",
        "tttr-12": "var(--tttr-radius-12)",
        "tttr-16": "var(--tttr-radius-16)",
        "tttr-20": "var(--tttr-radius-20)",
        "tttr-24": "var(--tttr-radius-24)",
      },
      spacing: {
        // TTTR Design System Spacing (from Figma)
        "tttr-4": "var(--tttr-spacing-4)",
        "tttr-8": "var(--tttr-spacing-8)",
        "tttr-12": "var(--tttr-spacing-12)",
        "tttr-16": "var(--tttr-spacing-16)",
        "tttr-20": "var(--tttr-spacing-20)",
        "tttr-24": "var(--tttr-spacing-24)",
        "tttr-32": "var(--tttr-spacing-32)",
        "tttr-40": "var(--tttr-spacing-40)",
        "tttr-48": "var(--tttr-spacing-48)",
        "tttr-64": "var(--tttr-spacing-64)",
        "tttr-80": "var(--tttr-spacing-80)",
        "tttr-96": "var(--tttr-spacing-96)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        // TTTR Design System Colors (extracted from Figma via MCP)
        tttr: {
          // Brand Primary
          "deep-dark": "var(--tttr-deep-dark)",
          purple: {
            DEFAULT: "var(--tttr-purple-primary)",
            hover: "var(--tttr-purple-hover)",
            dark: "var(--tttr-purple-dark)",
            light: "var(--tttr-purple-light)",
            accent: "var(--tttr-purple-accent)",
            darkest: "var(--tttr-purple-darkest)",
          },
          // Brand Neutral
          beige: {
            DEFAULT: "var(--tttr-beige)",
            light: "var(--tttr-beige-light)",
            mid: "var(--tttr-beige-mid)",
          },
          white: "var(--tttr-white)",
          "cloud-white": "var(--tttr-cloud-white)",
          lilac: "var(--tttr-lilac)",
          "blue-gray": "var(--tttr-blue-gray)",
          // Brand Extended
          blue: {
            DEFAULT: "var(--tttr-blue-primary)",
            dark: "var(--tttr-blue-dark)",
            light: "var(--tttr-blue-light)",
          },
          green: {
            dark: "var(--tttr-green-dark)",
            light: "var(--tttr-green-light)",
          },
          coral: "var(--tttr-coral)",
          rose: "var(--tttr-rose)",
          mango: "var(--tttr-mango)",
          // Semantic
          error: "var(--tttr-error)",
          // Text
          text: {
            heading: "var(--tttr-text-heading)",
            paragraph: "var(--tttr-text-paragraph)",
            caption: "var(--tttr-text-caption)",
            link: "var(--tttr-text-link)",
            inactive: "var(--tttr-text-inactive)",
          },
          // Surface/Elevation
          surface: {
            light: "var(--tttr-surface-light)",
            dark: "var(--tttr-surface-dark)",
            "dark-hover": "var(--tttr-surface-dark-hover)",
            cta: "var(--tttr-surface-cta)",
          },
          // Interface
          interface: {
            icon: "var(--tttr-interface-icon)",
            divider: "var(--tttr-interface-divider)",
          },
          // Progress
          progress: {
            idle: "var(--tttr-progress-idle)",
            active: "var(--tttr-progress-active)",
          },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
  safelist: ["w-32", "w-44", "w-52"],
};
export default config;
