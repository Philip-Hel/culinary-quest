import { useState, useEffect } from "react";

// Dark mode toggle. Flips the `dark` class on <html> (matches the
// `darkMode: "class"` setting in tailwind.config.js), persists the choice to
// localStorage, and defaults to the user's system preference on first load.

const STORAGE_KEY = "culinary-quest-theme";

function getInitialTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dark") return "dark";
  if (stored === "light") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function DarkModeToggle() {
  const [dark, setDark] = useState(() => getInitialTheme());

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark((d) => !d)}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="
        fixed bottom-[4.5rem] left-5 z-50 lg:bottom-5
        grid h-12 w-12 place-items-center text-xl
        bg-cq-surface/80 dark:bg-cq-darkSurface2/80
        backdrop-blur
        ring-1 ring-cq-border dark:ring-cq-darkBorder
        rounded-full shadow-cq dark:shadow-cqDark
        transition-all duration-300 ease-cq-smooth
        hover:scale-110 hover:rotate-12
      "
    >
      {dark ? "🌞" : "🌙"}
    </button>
  );
}
