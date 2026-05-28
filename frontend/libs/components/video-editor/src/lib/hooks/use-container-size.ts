import { useCallback, useState } from "react";
import { useResizeObserver } from "./use-resize-observer";

export function useContainerSize({
  containerRef,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
}) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onResize = useCallback((entry: ResizeObserverEntry) => {
    const { width, height } = entry.contentRect;
    setSize({ width, height });
  }, []);

  useResizeObserver({ ref: containerRef, onResize });

  return size;
}
