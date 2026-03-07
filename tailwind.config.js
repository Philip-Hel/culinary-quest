/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cq: {
          bg: "#faf7f2",
          surface: "#ffffff",
          primary: "#c44536",
          primaryDark: "#9e362b",
          secondary: "#e6b17e",
          accent: "#4a7c59",
          text: "#2f2f2f",
          muted: "#6b6b6b",
          border: "#e5ded6",

          // Dark mode palette
          darkBg: "#1b1b1b",
          darkSurface: "#242424",
          darkText: "#f5f5f5",
          darkMuted: "#a1a1a1",
          darkBorder: "#333333"
        }
      },
      fontFamily: {
        serif: ["Playfair Display", "serif"],
        sans: ["Inter", "sans-serif"]
      },
      boxShadow: {
        cq: "0 4px 20px rgba(0,0,0,0.06)",
        cqDark: "0 4px 20px rgba(0,0,0,0.25)"
      },
      transitionTimingFunction: {
        "cq-smooth": "cubic-bezier(0.4, 0.0, 0.2, 1)"
      }
    }
  },
  plugins: [],
};