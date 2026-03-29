/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0B0F14",
        sidebar: "#0F141B",
        card: "#121821",
        border: "#1F2A37",
        accent: "#00E5FF",
        "accent-hover": "#00cadd",
        textMain: "#E5E7EB",
        textMuted: "#9CA3AF"
      }
    },
  },
  plugins: [],
}
