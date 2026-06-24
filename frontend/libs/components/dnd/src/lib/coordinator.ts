import {
  DragPayload,
  DropTargetRegistration,
  HighlightState,
  MediaKind,
} from "./types";

// The drop-target registry + drag coordinator.
//
// A module-level singleton (mirroring the existing `galleryDnd` default export)
// rather than a React context, for two reasons:
//   1. The Tauri OS-file handler is plain async code outside React — it needs to
//      hit-test the registry imperatively.
//   2. The internal gallery drag is also a non-React pointer-event module.
// Both feed the SAME registry, which is the whole point of unifying DnD.
//
// Hit-testing is GEOMETRIC (rect math), not `document.elementFromPoint`, because
// during a gallery drag the modal goes pointer-transparent — the same reason
// galleryDnd's `folderIdAt` is geometric. Rects are read lazily per hit-test so
// scrolling/resizing mid-drag stays correct with zero bookkeeping.

interface Entry {
  reg: DropTargetRegistration;
  notify: (state: HighlightState) => void;
}

const entries = new Map<string, Entry>();

let activePayload: DragPayload | null = null;
let highlightedId: string | null = null;
let highlightState: HighlightState = null;
let rejectHandler: ((payload: DragPayload, targetLabel?: string) => void) | null = null;

// ── Registration ─────────────────────────────────────────────────────────────

function register(
  reg: DropTargetRegistration,
  notify: (state: HighlightState) => void,
): () => void {
  entries.set(reg.id, { reg, notify });
  return () => {
    entries.delete(reg.id);
    if (highlightedId === reg.id) {
      highlightedId = null;
      highlightState = null;
    }
  };
}

// ── Drag lifecycle ───────────────────────────────────────────────────────────

function beginDrag(payload: DragPayload) {
  activePayload = payload;
}

function endDrag() {
  activePayload = null;
  setHighlight(null, null);
}

function isDragging(): boolean {
  return activePayload !== null;
}

function getActivePayload(): DragPayload | null {
  return activePayload;
}

/** Host wires this to its toast system; called when a drag is released over a
 *  target that doesn't accept the payload's media kind. Keeps the lib free of a
 *  toast dependency. */
function setRejectHandler(
  fn: ((payload: DragPayload, targetLabel?: string) => void) | null,
) {
  rejectHandler = fn;
}

// ── Hover + drop (driven by gallery pointermove and OS dragover/drop) ─────────

/** Update target highlighting for the current pointer position. Returns the
 *  hovered target (most specific under the point) and whether it accepts the
 *  active payload, so callers can decide whether to suppress a catch-all overlay. */
function updateHover(
  cssX: number,
  cssY: number,
): { target: DropTargetRegistration | null; accepted: boolean } {
  const target = hitTest(cssX, cssY);
  if (!target) {
    setHighlight(null, null);
    return { target: null, accepted: false };
  }
  const accepted = payloadAcceptedBy(target);
  setHighlight(target.id, accepted ? "accept" : "reject");
  return { target, accepted };
}

/**
 * Resolve a release at (cssX, cssY) against the registry.
 * - Over an accepting target → routes the payload to its `onDrop`, returns true.
 * - Over a rejecting target  → fires the reject handler, returns true (consumed,
 *   so the caller does NOT fall back to a canvas/catch-all drop).
 * - Over no target           → returns false so the caller can fall back.
 *
 * `override` lets a caller supply the payload at drop time — needed for HTML5
 * file drops, where the actual File only becomes available in the drop event
 * (the hover phase only knows the media kind, not the bytes).
 */
async function drop(
  cssX: number,
  cssY: number,
  override?: DragPayload,
): Promise<boolean> {
  const payload = override ?? activePayload;
  const target = hitTest(cssX, cssY);
  setHighlight(null, null);

  if (!target || !payload) return false;

  if (!target.accepts.includes(payload.kind)) {
    rejectHandler?.(payload, target.label);
    return true;
  }

  await target.onDrop(payload);
  return true;
}

// ── Geometric hit-test (smallest matching rect wins) ─────────────────────────

function hitTest(cssX: number, cssY: number): DropTargetRegistration | null {
  let best: DropTargetRegistration | null = null;
  let bestArea = Infinity;

  for (const { reg } of entries.values()) {
    if (reg.disabled) continue;
    const el = reg.getEl();
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (
      cssX < rect.left ||
      cssX > rect.right ||
      cssY < rect.top ||
      cssY > rect.bottom
    ) {
      continue;
    }
    // Most specific (smallest) target under the point wins, so a small ref field
    // nested inside a larger panel target takes precedence.
    const area = rect.width * rect.height;
    if (area < bestArea) {
      bestArea = area;
      best = reg;
    }
  }

  return best;
}

function payloadAcceptedBy(target: DropTargetRegistration): boolean {
  const kind: MediaKind | null = activePayload?.kind ?? null;
  return kind != null && target.accepts.includes(kind);
}

// ── Highlight fan-out ────────────────────────────────────────────────────────

function setHighlight(id: string | null, state: HighlightState) {
  if (id === highlightedId && state === highlightState) return;
  // Clear the previously-highlighted target if it's a different one.
  if (highlightedId && highlightedId !== id) {
    entries.get(highlightedId)?.notify(null);
  }
  highlightedId = id;
  highlightState = state;
  if (id) entries.get(id)?.notify(state);
}

export const dndCoordinator = {
  register,
  beginDrag,
  endDrag,
  isDragging,
  getActivePayload,
  setRejectHandler,
  updateHover,
  drop,
  hitTest,
};
