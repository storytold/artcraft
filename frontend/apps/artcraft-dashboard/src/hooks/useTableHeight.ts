import { useRef, useState, useEffect, useCallback } from "react";

/**
 * Measures an element's position in the viewport and returns the
 * available height from that point to the bottom of the window.
 * Uses a callback ref so it recalculates when the element mounts.
 * Also recalculates on window resize.
 */
export function useTableHeight(bottomPadding = 36, minHeight = 200) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const [height, setHeight] = useState<number | undefined>();

  const calculate = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    const available = window.innerHeight - top - bottomPadding;
    setHeight(Math.max(available, minHeight));
  }, [bottomPadding, minHeight]);

  // Callback ref: fires when element mounts/unmounts
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      elRef.current = node;
      if (node) requestAnimationFrame(calculate);
    },
    [calculate],
  );

  useEffect(() => {
    window.addEventListener("resize", calculate);
    return () => window.removeEventListener("resize", calculate);
  }, [calculate]);

  return { ref, height };
}
