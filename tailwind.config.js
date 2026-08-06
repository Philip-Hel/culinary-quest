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
          // Light palette — warm editorial "cream + terracotta + olive"
          bg: "#faf6f0",            // page cream
          surface: "#ffffff",       // card surface
          primary: "#c0392b",       // terracotta red
          primaryDark: "#9a2f24",   // pressed terracotta
          accent: "#b8892f",        // warm gold
          accentSoft: "#efd9b0",    // light champagne
          olive: "#6a7f5f",         // muted olive
          text: "#2b2620",          // ink
          muted: "#7a7269",         // warm grey
          border: "#e6dccb",        // warm border
          ring: "#e9b98b",          // soft golden ring

          // Dark palette
          darkBg: "#16130f",        // deep espresso
          darkSurface: "#241f18",   // warm charcoal
          darkSurface2: "#2e2820",  // elevated surface
          darkText: "#f5efe6",      // cream text
          darkMuted: "#b3a898",     // muted warm grey
          darkBorder: "#3a332a",    // warm border
          darkRing: "#c98a4b"       // deep gold ring
        }
      },
      fontFamily: {
        serif: ["Playfair Display", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"]
      },
      fontSize: {
        "hero": ["clamp(2.75rem, 8vw, 5rem)", "1.05"],
      },
      letterSpacing: {
        tightest: "-0.03em",
        wideish: "0.06em",
      },
      boxShadow: {
        cq: "0 6px 24px -6px rgba(0,0,0,0.12), 0 2px 8px -2px rgba(0,0,0,0.06)",
        "cq-lg": "0 24px 60px -16px rgba(0,0,0,0.22), 0 8px 24px -12px rgba(0,0,0,0.12)",
        "cq-btn": "0 10px 24px -8px rgba(192,57,43,0.55)",
        "cq-brand": "inset 0 1px 0 rgba(255,255,255,0.18)",
        cqDark: "0 6px 24px -6px rgba(0,0,0,0.5), 0 2px 8px -2px rgba(0,0,0,0.35)",
        "cqDark-lg": "0 30px 70px -18px rgba(0,0,0,0.8)"
      },
      backgroundImage: {
        "cq-hero":
          "radial-gradient(circle at 12% 18%, rgba(233,141,78,0.28), transparent 42%), radial-gradient(circle at 88% 12%, rgba(185,137,47,0.22), transparent 40%), linear-gradient(180deg, #f6ead6 0%, #faf6f0 78%)",
        "cq-hero-dark":
          "radial-gradient(circle at 15% 20%, rgba(201,138,75,0.20), transparent 45%), radial-gradient(circle at 85% 15%, rgba(185,137,47,0.18), transparent 42%), linear-gradient(180deg, #1d1812 0%, #16130f 80%)",
        "cq-brand":
          "linear-gradient(135deg, #d94f3d 0%, #c0392b 55%, #a8352a 100%)",
        "cq-brand-hover":
          "linear-gradient(135deg, #dd5a46 0%, #c93f30 55%, #b23a2d 100%)",
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      transitionTimingFunction: {
        "cq-smooth": "cubic-bezier(0.4, 0.0, 0.2, 1)"
      },
      keyframes: {
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" }
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        "reveal": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "fadeIn": "fadeIn 0.6s ease-out",
        "reveal": "reveal 0.7s cubic-bezier(0.16,1,0.3,1) both"
      },
      aspectRatio: {
        "magazine": "4 / 5",
        "banner": "21 / 9"
      }
    }
  },
  plugins: [],
};
