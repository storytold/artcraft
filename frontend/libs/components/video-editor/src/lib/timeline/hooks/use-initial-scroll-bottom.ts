import { type RefObject, useLayoutEffect, useRef } from "react";

interface UseInitialScrollBottomProps {
  tracksScrollRef: RefObject<HTMLDivElement | null>;
  trackLabelsScrollRef: RefObject<HTMLDivElement | null>;
  onAfterScroll?: () => void;
  /** Defers the scroll until there is at least one track to measure against. */
  isReady: boolean;
}

/**
 * Scrolls the timeline tracks viewport to the bottom once on mount.
 * useLayoutEffect runs synchronously after React commits the DOM but before
 * the browser paints, so the initial scroll position is never visible.
 */
export function useInitialScrollBottom({
  tracksScrollRef,
  trackLabelsScrollRef,
  onAfterScroll,
  isReady,
}: UseInitialScrollBottomProps): void {
  const hasScrolledRef = useRef(false);

  useLayoutEffect(() => {
    if (!isReady || hasScrolledRef.current) return;

    const viewport = tracksScrollRef.current;
    if (!viewport) return;

    const maxScrollTop = viewport.scrollHeight - viewport.clientHeight;
    if (maxScrollTop <= 0) return;

    viewport.scrollTop = maxScrollTop;

    if (trackLabelsScrollRef.current) {
      trackLabelsScrollRef.current.scrollTop = maxScrollTop;
    }

    onAfterScroll?.();
    hasScrolledRef.current = true;
  }, [isReady, tracksScrollRef, trackLabelsScrollRef, onAfterScroll]);
}
