import { useSyncExternalStore } from "react";
import { isDesktop, watchDesktopTheme } from "./desktop-theme";
import { ThemeController } from "./theme-controller";

let controller: ThemeController | undefined;

function getController(): ThemeController {
  if (!controller) {
    // Defer browser access until mounted; a disabled localStorage getter can throw.
    controller = new ThemeController({
      root: document.documentElement,
      storage: {
        getItem: (key) => localStorage.getItem(key),
        setItem: (key, value) => localStorage.setItem(key, value),
      },
      isDesktop,
      watch: watchDesktopTheme,
    });
  }
  return controller;
}

export function initializeAppTheme(): () => void {
  const stop = getController().start();
  window.addEventListener("pagehide", stop);
  return () => {
    window.removeEventListener("pagehide", stop);
    stop();
  };
}

export function useAppTheme() {
  const controller = getController();
  const snapshot = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
  );
  return { ...snapshot, select: controller.select };
}
