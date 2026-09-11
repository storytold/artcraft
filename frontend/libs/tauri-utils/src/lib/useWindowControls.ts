import { useEffect, useState, useCallback } from "react";
import { IsDesktopApp } from "./IsDesktopApp";

async function getCurrentWindowSafe() {
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  return getCurrentWindow();
}

export function useTauriWindowControls() {
  const isDesktop = IsDesktopApp();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!isDesktop) return;
    let unlistenMax: (() => void) | undefined;
    let unlistenUnmax: (() => void) | undefined;
    let unlistenResize: (() => void) | undefined;

    (async () => {
      try {
        const win = await getCurrentWindowSafe();
        setIsMaximized(await win.isMaximized());
      } catch (err) {
        // ignore
      }

      try {
        const { listen } = await import("@tauri-apps/api/event");
        unlistenMax = await listen("tauri://maximize", () =>
          setIsMaximized(true)
        );
        unlistenUnmax = await listen("tauri://unmaximize", () =>
          setIsMaximized(false)
        );
        unlistenResize = await listen("tauri://resize", async () => {
          try {
            const win = await getCurrentWindowSafe();
            setIsMaximized(await win.isMaximized());
          } catch (err) {
            // ignore
          }
        });
      } catch (err) {
        // ignore
      }
    })();

    return () => {
      if (unlistenMax) unlistenMax();
      if (unlistenUnmax) unlistenUnmax();
      if (unlistenResize) unlistenResize();
    };
  }, [isDesktop]);

  const minimize = useCallback(async () => {
    if (!isDesktop) return;
    const win = await getCurrentWindowSafe();
    await win.minimize();
  }, [isDesktop]);

  const toggleMaximize = useCallback(async () => {
    if (!isDesktop) return;
    const win = await getCurrentWindowSafe();
    await win.toggleMaximize();
  }, [isDesktop]);

  const close = useCallback(async () => {
    if (!isDesktop) return;
    const win = await getCurrentWindowSafe();
    await win.close();
  }, [isDesktop]);

  return { isDesktop, isMaximized, minimize, toggleMaximize, close };
}

export async function minimizeCurrentWindow() {
  const win = await getCurrentWindowSafe();
  return win.minimize();
}

export async function toggleMaximizeCurrentWindow() {
  const win = await getCurrentWindowSafe();
  return win.toggleMaximize();
}

export async function closeCurrentWindow() {
  const win = await getCurrentWindowSafe();
  return win.close();
}

export async function isCurrentWindowMaximized(): Promise<boolean> {
  const win = await getCurrentWindowSafe();
  return win.isMaximized();
}
