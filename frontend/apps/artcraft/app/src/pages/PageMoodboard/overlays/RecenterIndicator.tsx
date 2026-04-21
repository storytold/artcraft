import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCompress } from "@fortawesome/pro-solid-svg-icons";
import { useMoodboardStore } from "../MoodboardStore";
import { anyContentVisible } from "../layout/geometry";

// Small pill button in the bottom-right that appears when the user has
// panned or zoomed so far that no content is on screen. Clicking it calls
// `fitToContent` to frame all nodes back into view. Hidden on an empty
// board (nothing to recenter on) and whenever any node intersects the
// visible viewport.
export const RecenterIndicator = () => {
  const nodes = useMoodboardStore((s) => s.nodes);
  const rootOrder = useMoodboardStore((s) => s.rootOrder);
  const viewport = useMoodboardStore((s) => s.viewport);
  const canvasSize = useMoodboardStore((s) => s.canvasSize);
  const fitToContent = useMoodboardStore((s) => s.fitToContent);

  if (rootOrder.length === 0) return null;
  if (anyContentVisible(nodes, rootOrder, viewport, canvasSize)) return null;

  return (
    <button
      type="button"
      onClick={() => fitToContent()}
      title="Zoom to fit (Shift+1)"
      className="pointer-events-auto absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-full border border-white/20 bg-black/70 px-3 py-2 text-sm text-white/90 shadow-lg backdrop-blur-sm transition-colors hover:bg-black/80"
    >
      <FontAwesomeIcon icon={faCompress} />
      <span>Content off-screen — recenter</span>
    </button>
  );
};
