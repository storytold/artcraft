import { RefObject, useCallback, useEffect, useRef, useState } from "react";

// Reserves room for the inline action-buttons row plus the fixed
// Model / Costs / Help row at the bottom of the page.
const BOTTOM_SAFE_AREA_PX = 160;

// Collapsed auto-grow cap (~5.5em) so a long prompt doesn't fight manual resize.
const COLLAPSED_MAX_PX = 88;

// Absolute ceiling shared by both collapsed and expanded states.
const HARD_MAX_PX = 500;

// Viewport-relative expansion ceiling. Mirrors the historical
// `clamp(120px, calc(100vh - 700px), 500px)` so the editor stretches the same
// amount regardless of where the (bottom-fixed) prompt box sits on screen.
export const EXPANDED_HEIGHT_CSS = "clamp(120px, calc(100vh - 700px), 500px)";

interface AutoGrowEditorHeight {
  isExpanded: boolean;
  toggleExpand: () => void;
}

/**
 * Manages a prompt editor's collapsed auto-grow + manual expand behavior.
 *
 * - Collapsed: caps height to the editor's actual position so a long prompt
 *   never pushes the box under the fixed bottom action row.
 * - Expanded: stretches to a viewport-relative ceiling.
 *
 * Heights are recomputed on expand toggle, on content change (`contentKey`),
 * and on viewport changes (window resize / fullscreen / monitor move) — not on
 * every render, so it stays out of React's way and avoids layout thrash.
 *
 * @param editorRef ref to the textarea (or contenteditable) element being sized
 * @param contentKey a value that changes when the editor content changes
 *   (e.g. the prompt string) so auto-grow re-runs on input
 */
export function useAutoGrowEditorHeight(
  editorRef: RefObject<HTMLElement | null>,
  contentKey: unknown,
): AutoGrowEditorHeight {
  const [isExpanded, setIsExpanded] = useState(false);

  const computeExpandedMaxPx = (): number =>
    Math.max(120, Math.min(window.innerHeight - 700, HARD_MAX_PX));

  const computeCollapsedMaxPx = (el: HTMLElement): number => {
    const topFromViewport = el.getBoundingClientRect().top;
    return Math.max(
      COLLAPSED_MAX_PX,
      Math.min(
        HARD_MAX_PX,
        Math.floor(window.innerHeight - topFromViewport - BOTTOM_SAFE_AREA_PX),
      ),
    );
  };

  const applyHeights = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const maxH = isExpanded ? computeExpandedMaxPx() : computeCollapsedMaxPx(el);
    el.style.maxHeight = `${maxH}px`;
    el.style.minHeight = "0";
    if (!isExpanded) {
      const capped = Math.min(el.scrollHeight, COLLAPSED_MAX_PX);
      el.style.minHeight = `${capped}px`;
    }
  }, [editorRef, isExpanded]);

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => {
      const next = !prev;
      const el = editorRef.current;
      if (el) {
        el.style.height = next ? EXPANDED_HEIGHT_CSS : "auto";
      }
      return next;
    });
  }, [editorRef]);

  // Recompute on expand toggle and whenever the content changes (input/paste).
  useEffect(() => {
    applyHeights();
  }, [applyHeights, contentKey]);

  // Re-apply on viewport changes. Held in a ref so the once-installed listener
  // always invokes the latest closure. Fires immediately + after a short settle
  // so getBoundingClientRect reads the final position, not a mid-tween one.
  const applyHeightsRef = useRef(applyHeights);
  applyHeightsRef.current = applyHeights;
  useEffect(() => {
    let settledId: number | undefined;
    const onResize = () => {
      applyHeightsRef.current();
      if (settledId !== undefined) window.clearTimeout(settledId);
      settledId = window.setTimeout(() => applyHeightsRef.current(), 100);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (settledId !== undefined) window.clearTimeout(settledId);
    };
  }, []);

  return { isExpanded, toggleExpand };
}
