import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: "class",
    content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
        extend: {
                colors: {
                        background: 'hsl(var(--background-hsl) / <alpha-value>)',
                        foreground: 'hsl(var(--foreground-hsl) / <alpha-value>)',
                        card: {
                                DEFAULT: 'hsl(var(--card-hsl) / <alpha-value>)',
                                foreground: 'hsl(var(--card-foreground-hsl) / <alpha-value>)'
                        },
                        popover: {
                                DEFAULT: 'hsl(var(--popover-hsl) / <alpha-value>)',
                                foreground: 'hsl(var(--popover-foreground-hsl) / <alpha-value>)'
                        },
                        primary: {
                                DEFAULT: 'hsl(var(--primary-hsl) / <alpha-value>)',
                                foreground: 'hsl(var(--primary-foreground-hsl) / <alpha-value>)'
                        },
                        secondary: {
                                DEFAULT: 'hsl(var(--secondary-hsl) / <alpha-value>)',
                                foreground: 'hsl(var(--secondary-foreground-hsl) / <alpha-value>)'
                        },
                        muted: {
                                DEFAULT: 'hsl(var(--muted-hsl) / <alpha-value>)',
                                foreground: 'hsl(var(--muted-foreground-hsl) / <alpha-value>)'
                        },
                        accent: {
                                DEFAULT: 'hsl(var(--accent-hsl) / <alpha-value>)',
                                foreground: 'hsl(var(--accent-foreground-hsl) / <alpha-value>)'
                        },
                        destructive: {
                                DEFAULT: 'hsl(var(--destructive-hsl) / <alpha-value>)',
                                foreground: 'hsl(var(--destructive-foreground-hsl) / <alpha-value>)'
                        },
                        border: 'var(--border)',
                        input: 'var(--input)',
                        ring: 'hsl(var(--ring-hsl) / <alpha-value>)',
                        chart: {
                                '1': 'hsl(var(--chart-1-hsl) / <alpha-value>)',
                                '2': 'hsl(var(--chart-2-hsl) / <alpha-value>)',
                                '3': 'hsl(var(--chart-3-hsl) / <alpha-value>)',
                                '4': 'hsl(var(--chart-4-hsl) / <alpha-value>)',
                                '5': 'hsl(var(--chart-5-hsl) / <alpha-value>)'
                        }
                },
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)'
                }
        }
  },
  plugins: [tailwindcssAnimate],
};
export default config;
