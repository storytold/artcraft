import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

function getInitialDark(): boolean {
  if (typeof document === 'undefined') return true;
  return document.documentElement.classList.contains('dark');
}

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean>(getInitialDark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem('vi-theme', dark ? 'dark' : 'light');
    } catch {
      /* ignore storage failures */
    }
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark((d) => !d)}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="group inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-300/70 bg-white/60 text-slate-600 backdrop-blur transition hover:scale-105 hover:text-violet-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-cyan-300"
    >
      {dark ? (
        <Sun className="h-5 w-5 transition group-hover:rotate-45" />
      ) : (
        <Moon className="h-5 w-5 transition group-hover:-rotate-12" />
      )}
    </button>
  );
}
