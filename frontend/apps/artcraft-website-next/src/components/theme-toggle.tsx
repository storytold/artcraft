"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "lucide-react";

const STORAGE_KEY = "artcraft-theme";

type Theme = "light" | "dark";

function resolveCurrentTheme(): Theme {
  const explicit = document.documentElement.getAttribute("data-theme");
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// Cell-styled theme switch. Follows the system preference until the visitor
// makes an explicit choice, which is persisted and applied pre-paint by the
// inline script in the root layout.
export default function ThemeToggle({ className }: { className?: string }) {
  // Render a stable placeholder until mounted — the real theme is only
  // knowable on the client.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(resolveCurrentTheme());
  }, []);

  const toggle = () => {
    const next: Theme = resolveCurrentTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private-mode storage failures just lose persistence, not the toggle.
    }
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      }
      className={`invert-block flex items-center justify-center text-muted hover:text-invert-fg ${className ?? ""}`}
    >
      {theme === "dark" ? (
        <SunIcon aria-hidden className="h-4 w-4" />
      ) : (
        <MoonIcon aria-hidden className="h-4 w-4" />
      )}
    </button>
  );
}
