// React-scoped wrapper around the editor's three.js Stats panel.
// Subscribes to `statsVisible` in the Zustand store (toggled by the
// backtick keybind on PageScene) and attaches the Stats DOM into a
// container div that lives inside the PageScene tree — not document
// .body — so the FPS panel only renders while the user is on the 3D
// route and disappears when they navigate away.
//
// The Stats instance itself is owned by Editor (so the render loop
// can tick it via `editor.stats.update()` regardless of whether the
// panel is visible). This component just relocates its DOM node.

import { useContext, useEffect, useRef } from "react";
import { EngineContext } from "../contexts/EngineContext/EngineContext";
import { usePageSceneStore } from "../PageSceneStore";

export function PerfStatsOverlay() {
  const editor = useContext(EngineContext);
  const visible = usePageSceneStore((s) => s.statsVisible);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible || !editor) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;

    const dom = editor.stats.dom;
    // Stats sets fixed top-left positioning on document.body by default;
    // re-anchor it to the bottom-left of our wrapper so the panel sits
    // above the wrapper's anchor point and aligns with the bottom-left
    // corner of the scene viewport.
    dom.style.position = "absolute";
    dom.style.left = "0";
    dom.style.bottom = "0";
    dom.style.top = "auto";
    container.appendChild(dom);

    return () => {
      if (dom.parentElement === container) {
        container.removeChild(dom);
      }
    };
  }, [editor, visible]);

  if (!visible) return null;
  // Bottom-left of the scene container. zIndex high enough to clear
  // the bottom-row outliner/preview.
  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute bottom-2 left-2 z-50"
    />
  );
}
