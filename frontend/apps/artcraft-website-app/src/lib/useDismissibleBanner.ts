import { useCallback, useState } from "react";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function useDismissibleBanner(
  key: string,
  hideForMs: number = ONE_DAY_MS,
): { visible: boolean; dismiss: () => void } {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    const raw = window.localStorage.getItem(key);
    if (!raw) return true;
    const ts = parseInt(raw, 10);
    if (Number.isNaN(ts)) return true;
    return Date.now() - ts > hideForMs;
  });

  const dismiss = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, String(Date.now()));
    }
    setVisible(false);
  }, [key]);

  return { visible, dismiss };
}
