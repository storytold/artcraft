import { useContext, useEffect, useState } from "react";
import { EngineContext } from "../contexts/EngineContext/EngineContext";

// Reactive viewport dimensions. Reads from the host adapter's
// `getViewportSize` when supplied (e.g. artcraft threads its
// `pageWidth`/`pageHeight` signals through), otherwise falls back to
// `window.innerWidth`/`innerHeight` and refreshes on resize so the
// lib remains usable in plain web hosts.
export const useViewportSize = (): { width: number; height: number } => {
  const editor = useContext(EngineContext);
  const adapterGet = editor?.adapter.getViewportSize;

  const [size, setSize] = useState(() =>
    adapterGet?.() ?? {
      width: typeof window !== "undefined" ? window.innerWidth : 0,
      height: typeof window !== "undefined" ? window.innerHeight : 0,
    },
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const onResize = () => {
      setSize(
        adapterGet?.() ?? {
          width: window.innerWidth,
          height: window.innerHeight,
        },
      );
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [adapterGet]);

  return size;
};
