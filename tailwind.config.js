/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        graphite: {
          DEFAULT: "#131317",
          raised: "#24242D",
          line: "#3C3C48",
        },
        edge: {
          violet: "#7C6CFF",
          ember: "#FF7A54",
        },
        ash: "#9C9CA8",
        paper: "#F3F2F7",
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        sans: ["Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
