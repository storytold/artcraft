import { useEffect, useState } from "react";

// Reads the active theme's foreground color (`--st-fg-rgb`) as a "R G B" string,
// e.g. "255 255 255" for dark themes / "17 24 39" for light. Konva fills don't
// resolve `var()`, so we expand it once and re-read whenever the theme class on
// `<html>` changes.
const readFgRgb = (): string => {
  if (typeof window === "undefined") return "255 255 255";
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue("--st-fg-rgb")
    .trim();
  return v || "255 255 255";
};

export const useThemeFgRgb = (): string => {
  const [fgRgb, setFgRgb] = useState(readFgRgb);

  useEffect(() => {
    const update = () => setFgRgb(readFgRgb());
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === "class") {
          update();
          return;
        }
      }
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return fgRgb;
};
