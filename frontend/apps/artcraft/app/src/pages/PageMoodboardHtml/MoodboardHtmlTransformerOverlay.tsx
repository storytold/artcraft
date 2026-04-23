import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useMoodboardStore } from "../PageMoodboard/MoodboardStore";
import { MoodboardNode } from "../PageMoodboard/types";

interface Props {
  // Stage container rect (client coords) is used for nothing directly — the
  // overlay is mounted inside the container so its own 0,0 lines up — but
  // keeping it here lets us hoist rect math later if we need it.
  containerRef: React.RefObject<HTMLDivElement | null>;
}

type HandleKey =
  | "nw"
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w"
  | "rotate";

const HANDLE_SIZE = 10;
const ROTATE_OFFSET = 24;
const HANDLE_STROKE = "#3b82f6";
const HANDLE_FILL = "#ffffff";

// Screen-space handles for resize + rotate on a single selected node. Multi-
// select resize isn't in scope for V1 — use Group (Cmd+G) to resize multiples.
// The overlay renders inside the stage container (non-transformed) so all
// coordinates below are in container-local screen px.
export const MoodboardHtmlTransformerOverlay = ({ containerRef: _containerRef }: Props) => {
  const { nodes, selectedIds, viewport, editingTextId } = useMoodboardStore(
    useShallow((s) => ({
      nodes: s.nodes,
      selectedIds: s.selectedIds,
      viewport: s.viewport,
      editingTextId: s.transient.editingTextId,
    })),
  );
  const updateNode = useMoodboardStore((s) => s.updateNode);
  const pushHistory = useMoodboardStore((s) => s.pushHistory);

  const selectedArr = useMemo(() => Array.from(selectedIds), [selectedIds]);
  const onlyId = selectedArr.length === 1 ? selectedArr[0] : null;
  const onlyNode = onlyId ? nodes[onlyId] : null;

  // Hide transformer while editing a text node (matches Konva page behavior).
  if (editingTextId) return null;
  if (!onlyNode) {
    // Selection outlines for multi-select still render from MoodboardHtmlStage.
    return null;
  }

  // Compute the four rotated corners of the node in world coords, then map
  // to container-screen coords via pan + zoom. This gives us the exact screen
  // positions for the handles regardless of zoom/pan/rotation.
  const rad = (onlyNode.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const worldCorner = (dx: number, dy: number) => ({
    x: onlyNode.x + dx * cos - dy * sin,
    y: onlyNode.y + dx * sin + dy * cos,
  });
  const toScreen = (p: { x: number; y: number }) => ({
    x: viewport.pan.x + p.x * viewport.zoom,
    y: viewport.pan.y + p.y * viewport.zoom,
  });
  const nwW = worldCorner(0, 0);
  const neW = worldCorner(onlyNode.width, 0);
  const seW = worldCorner(onlyNode.width, onlyNode.height);
  const swW = worldCorner(0, onlyNode.height);
  const nw = toScreen(nwW);
  const ne = toScreen(neW);
  const se = toScreen(seW);
  const sw = toScreen(swW);
  const mid = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  });
  const nMid = mid(nw, ne);
  const eMid = mid(ne, se);
  const sMid = mid(se, sw);
  const wMid = mid(sw, nw);

  // Unit vector along the top edge (for rotate handle placement perpendicular).
  const topVec = { x: ne.x - nw.x, y: ne.y - nw.y };
  const topLen = Math.hypot(topVec.x, topVec.y) || 1;
  const perpUnit = { x: -topVec.y / topLen, y: topVec.x / topLen };
  // Rotate handle sits "above" the top edge (outside the node, away from center).
  // Center-of-node in screen coords:
  const center = {
    x: (nw.x + se.x) / 2,
    y: (nw.y + se.y) / 2,
  };
  // Flip the perpendicular so it points away from center.
  const sign =
    (nMid.x - center.x) * perpUnit.x + (nMid.y - center.y) * perpUnit.y >= 0
      ? 1
      : -1;
  const rotateAnchor = {
    x: nMid.x + perpUnit.x * sign * ROTATE_OFFSET,
    y: nMid.y + perpUnit.y * sign * ROTATE_OFFSET,
  };

  const startDrag = (
    key: HandleKey,
    startClient: { x: number; y: number },
  ) => {
    pushHistory();
    const startNode: MoodboardNode = { ...onlyNode };
    const startRad = (startNode.rotation * Math.PI) / 180;
    const sCos = Math.cos(startRad);
    const sSin = Math.sin(startRad);
    // Anchor in world coords: the corner opposite the handle being dragged
    // stays fixed during resize. For edge handles, the opposite edge's
    // midpoint is the anchor along that axis.
    const { x: nx, y: ny, width: nw0, height: nh0 } = startNode;
    // Convert a client-space delta to local-axis delta (the node's own axes).
    const clientToLocal = (cdx: number, cdy: number) => {
      const worldDx = cdx / viewport.zoom;
      const worldDy = cdy / viewport.zoom;
      return {
        lx: worldDx * sCos + worldDy * sSin,
        ly: -worldDx * sSin + worldDy * sCos,
      };
    };

    const onMove = (ev: PointerEvent) => {
      const cdx = ev.clientX - startClient.x;
      const cdy = ev.clientY - startClient.y;
      if (key === "rotate") {
        // Rotate around the node's center. Angle is measured from the center
        // to the pointer, minus the initial angle.
        const startCenterWorld = {
          x: startNode.x + (nw0 / 2) * sCos - (nh0 / 2) * sSin,
          y: startNode.y + (nw0 / 2) * sSin + (nh0 / 2) * sCos,
        };
        // Need a ref rect for client coord conversion — use _containerRef.
        const rect = _containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const centerScreen = {
          x: viewport.pan.x + startCenterWorld.x * viewport.zoom + rect.left,
          y: viewport.pan.y + startCenterWorld.y * viewport.zoom + rect.top,
        };
        const startAngle =
          (Math.atan2(startClient.y - centerScreen.y, startClient.x - centerScreen.x) *
            180) /
          Math.PI;
        const nowAngle =
          (Math.atan2(ev.clientY - centerScreen.y, ev.clientX - centerScreen.x) *
            180) /
          Math.PI;
        const deltaDeg = nowAngle - startAngle;
        // Rotate around the node center means the top-left must be repositioned
        // to keep the center fixed.
        const newRotation = startNode.rotation + deltaDeg;
        const newRad = (newRotation * Math.PI) / 180;
        const nCos = Math.cos(newRad);
        const nSin = Math.sin(newRad);
        // Keep center fixed: new (x, y) = center - rotate((w/2, h/2), newRotation)
        const newX = startCenterWorld.x - (nw0 / 2) * nCos + (nh0 / 2) * nSin;
        const newY = startCenterWorld.y - (nw0 / 2) * nSin - (nh0 / 2) * nCos;
        updateNode(startNode.id, {
          rotation: newRotation,
          x: newX,
          y: newY,
        });
        return;
      }

      // Live modifier state — re-read every move so toggling Shift/Alt
      // mid-drag updates the behavior immediately (matches Figma).
      const shift = ev.shiftKey;
      const alt = ev.altKey;

      const { lx, ly } = clientToLocal(cdx, cdy);

      const isLeftHandle = key === "nw" || key === "w" || key === "sw";
      const isRightHandle = key === "ne" || key === "e" || key === "se";
      const isTopHandle = key === "nw" || key === "n" || key === "ne";
      const isBottomHandle = key === "sw" || key === "s" || key === "se";
      const affectsX = isLeftHandle || isRightHandle;
      const affectsY = isTopHandle || isBottomHandle;

      // Step 1: raw size deltas from the handle's sides.
      let dw = 0;
      let dh = 0;
      if (isRightHandle) dw = lx;
      if (isLeftHandle) dw = -lx;
      if (isBottomHandle) dh = ly;
      if (isTopHandle) dh = -ly;

      // Step 2: Alt expands from center → both edges of the affected dim
      // move, so the delta doubles.
      if (alt) {
        if (affectsX) dw *= 2;
        if (affectsY) dh *= 2;
      }

      // Step 3: Shift applies aspect-lock.
      //   Corner: unify via the dominant dim's fractional change.
      //   Edge: propagate the dragged dim to the perpendicular one via aspect.
      if (shift) {
        const aspect = nw0 / nh0;
        if (affectsX && affectsY) {
          const fracW = dw / nw0;
          const fracH = dh / nh0;
          const s = Math.abs(fracW) >= Math.abs(fracH) ? fracW : fracH;
          dw = nw0 * s;
          dh = nh0 * s;
        } else if (affectsX) {
          dh = dw / aspect;
        } else if (affectsY) {
          dw = dh * aspect;
        }
      }

      // Step 4: anchor per dim. Alt → center (0.5). Otherwise the opposite
      // side (0 for right-handles, 1 for left-handles; 0 for bottom, 1 for
      // top). Dims not affected by the handle default to 0.5, which is what
      // Figma's edge+Shift does for the propagated perpendicular axis.
      let ax = 0.5;
      let ay = 0.5;
      if (!alt) {
        if (isLeftHandle) ax = 1;
        else if (isRightHandle) ax = 0;
        if (isTopHandle) ay = 1;
        else if (isBottomHandle) ay = 0;
      }
      let dxLocal = -ax * dw;
      let dyLocal = -ay * dh;

      // Enforce minimum size so the node doesn't invert. Re-derive dx/dy so
      // the anchor stays correct after clamping (aspect may drift by a pixel
      // at min size — acceptable edge case).
      const MIN_SIZE = 8;
      let newW = nw0 + dw;
      let newH = nh0 + dh;
      if (newW < MIN_SIZE) {
        const adj = MIN_SIZE - newW;
        newW = MIN_SIZE;
        dw += adj;
        dxLocal = -ax * dw;
      }
      if (newH < MIN_SIZE) {
        const adj = MIN_SIZE - newH;
        newH = MIN_SIZE;
        dh += adj;
        dyLocal = -ay * dh;
      }

      // Convert local-axis translation back to world-axis to update (x, y).
      const worldDx = dxLocal * sCos - dyLocal * sSin;
      const worldDy = dxLocal * sSin + dyLocal * sCos;
      const patch: Partial<MoodboardNode> = {
        x: nx + worldDx,
        y: ny + worldDy,
        width: newW,
        height: newH,
      };
      // Text nodes scale their fontSize uniformly to match Konva behavior.
      if (startNode.kind === "text") {
        const uniform = (newW / nw0 + newH / nh0) / 2;
        (patch as Partial<MoodboardNode> & { fontSize?: number }).fontSize =
          startNode.fontSize * uniform;
      }
      updateNode(startNode.id, patch);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const handleStyle = (key: HandleKey, pos: { x: number; y: number }) => {
    const cursorByKey: Record<HandleKey, string> = {
      nw: "nwse-resize",
      ne: "nesw-resize",
      se: "nwse-resize",
      sw: "nesw-resize",
      n: "ns-resize",
      s: "ns-resize",
      e: "ew-resize",
      w: "ew-resize",
      rotate: "grab",
    };
    return {
      position: "absolute" as const,
      left: pos.x - HANDLE_SIZE / 2,
      top: pos.y - HANDLE_SIZE / 2,
      width: HANDLE_SIZE,
      height: HANDLE_SIZE,
      background: HANDLE_FILL,
      border: `1px solid ${HANDLE_STROKE}`,
      borderRadius: key === "rotate" ? "50%" : 2,
      cursor: cursorByKey[key],
      pointerEvents: "auto" as const,
      zIndex: 3,
      boxSizing: "border-box" as const,
    };
  };

  const onHandlePointerDown =
    (key: HandleKey) => (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      // React's stopPropagation only stops React's synthetic bubble. The
      // data-moodboard-html-handle attribute on the element lets the native
      // pointerdown listener in useHtmlSelection skip this click too, so we
      // don't start a marquee while dragging a handle.
      e.stopPropagation();
      e.preventDefault();
      startDrag(key, { x: e.clientX, y: e.clientY });
    };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
    >
      {/* Connector line from top-edge midpoint to rotate handle */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <line
          x1={nMid.x}
          y1={nMid.y}
          x2={rotateAnchor.x}
          y2={rotateAnchor.y}
          stroke={HANDLE_STROKE}
          strokeWidth={1}
        />
      </svg>
      <div
        data-moodboard-html-handle="nw"
        style={handleStyle("nw", nw)}
        onPointerDown={onHandlePointerDown("nw")}
      />
      <div
        data-moodboard-html-handle="n"
        style={handleStyle("n", nMid)}
        onPointerDown={onHandlePointerDown("n")}
      />
      <div
        data-moodboard-html-handle="ne"
        style={handleStyle("ne", ne)}
        onPointerDown={onHandlePointerDown("ne")}
      />
      <div
        data-moodboard-html-handle="e"
        style={handleStyle("e", eMid)}
        onPointerDown={onHandlePointerDown("e")}
      />
      <div
        data-moodboard-html-handle="se"
        style={handleStyle("se", se)}
        onPointerDown={onHandlePointerDown("se")}
      />
      <div
        data-moodboard-html-handle="s"
        style={handleStyle("s", sMid)}
        onPointerDown={onHandlePointerDown("s")}
      />
      <div
        data-moodboard-html-handle="sw"
        style={handleStyle("sw", sw)}
        onPointerDown={onHandlePointerDown("sw")}
      />
      <div
        data-moodboard-html-handle="w"
        style={handleStyle("w", wMid)}
        onPointerDown={onHandlePointerDown("w")}
      />
      <div
        data-moodboard-html-handle="rotate"
        style={handleStyle("rotate", rotateAnchor)}
        onPointerDown={onHandlePointerDown("rotate")}
      />
    </div>
  );
};
