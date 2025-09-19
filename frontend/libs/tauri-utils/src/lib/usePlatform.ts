import { useEffect, useState } from "react";
import { IsDesktopApp } from "./IsDesktopApp";

export type TauriPlatform = "windows" | "macos" | "linux";

export function useTauriPlatform(): TauriPlatform | undefined {
  const [platform, setPlatform] = useState<TauriPlatform | undefined>(
    undefined
  );

  useEffect(() => {
    if (!IsDesktopApp()) return;
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent || "";
      if (/Macintosh|Mac OS X/i.test(ua)) setPlatform("macos");
      else if (/Windows/i.test(ua)) setPlatform("windows");
      else setPlatform("linux");
    }
  }, []);

  return platform;
}
