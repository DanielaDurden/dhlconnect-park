import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dhl: {
          red: "#D40511",
          yellow: "#FFCC00",
          dark: "#1A1A1A",
          gray: "#666666",
          "light-gray": "#F5F5F5",
          "mid-gray": "#E0E0E0",
        },
        desk: {
          available: "#22C55E",
          occupied: "#9CA3AF",
          owned: "#FACC15",
          mine: "#3B82F6",
          requested: "#F97316",
          office: "#C4B5FD",
        },
        parking: {
          available: "#22C55E",
          occupied: "#9CA3AF",
          fixed: "#FACC15",
          director: "#FB923C",
          blocked: "#EF4444",
          mine: "#3B82F6",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["Arial", "Helvetica", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
