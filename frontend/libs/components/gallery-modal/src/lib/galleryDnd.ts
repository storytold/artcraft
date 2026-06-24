import { GalleryItem } from "./gallery-modal";
import {
  galleryModalDraggingUnder,
  galleryModalVisibleViewMode,
  galleryReopenAfterDragSignal,
} from "./galleryModalSignals";

interface DragState {
  item: GalleryItem | null;
  items: GalleryItem[];
  isDragging: boolean;
  startX: number;
  startY: number;
  currX: number;
  currY: number;
}

const dragState: DragState = {
  item: null,
  items: [],
  isDragging: false,
  startX: 0,
  startY: 0,
  currX: 0,
  currY: 0,
};

const dragThreshold = 5;

// ── Drag preview (floating chip that follows cursor) ─────────────────────────
let dragPreviewEl: HTMLDivElement | null = null;

function createDragPreview(count: number) {
  removeDragPreview();
  if (count <= 1) return;

  const el = document.createElement("div");
  el.textContent = String(count);
  el.style.cssText = `
    position: fixed;
    z-index: 99999;
    pointer-events: none;
    min-width: 22px;
    height: 22px;
    border-radius: 11px;
    background: var(--primary, #ffb500);
    color: #000;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
    line-height: 1;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  `;

  document.body.appendChild(el);
  dragPreviewEl = el;
}

function updateDragPreviewPosition(x: number, y: number) {
  if (!dragPreviewEl) return;
  dragPreviewEl.style.left = `${x + 12}px`;
  dragPreviewEl.style.top = `${y - 28}px`;
}

function removeDragPreview() {
  if (dragPreviewEl) {
    dragPreviewEl.remove();
    dragPreviewEl = null;
  }
}

// ── Drop-success ripple ──────────────────────────────────────────────────────
// A quick brand-colored ring that expands and fades at the drop point, so a
// successful drop reads as a deliberate landing instead of the item silently
// vanishing. Self-removing; skipped under reduced-motion.
function spawnDropRipple(x: number, y: number) {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const ring = document.createElement("div");
  ring.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    z-index: 99998;
    width: 30px;
    height: 30px;
    margin-left: -15px;
    margin-top: -15px;
    border-radius: 9999px;
    border: 2px solid var(--primary, #2d81ff);
    pointer-events: none;
  `;
  document.body.appendChild(ring);

  const anim = ring.animate(
    [
      { transform: "scale(0.4)", opacity: 0.9 },
      { transform: "scale(2.6)", opacity: 0 },
    ],
    { duration: 460, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
  );
  anim.onfinish = () => ring.remove();
  anim.oncancel = () => ring.remove();
}

// ── Drag lifecycle ───────────────────────────────────────────────────────────

function onPointerDown(
  event: React.PointerEvent,
  item: GalleryItem,
  bulkItems?: GalleryItem[],
) {
  if (event.button !== 0) return;
  dragState.item = item;
  dragState.items = bulkItems && bulkItems.length > 0 ? bulkItems : [item];
  dragState.startX = event.pageX;
  dragState.startY = event.pageY;
  dragState.currX = event.pageX;
  dragState.currY = event.pageY;
  dragState.isDragging = false;
  document.body.style.cursor = "grabbing";
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
}

/**
 * The folder chip under a screen point, found geometrically. We can't use
 * `elementFromPoint` here: once a drag begins the modal goes pointer-transparent
 * (so the drag can reach the canvas), which would make hit-testing skip the
 * folder chips entirely.
 */
function folderIdAt(clientX: number, clientY: number): string | null {
  const chips = Array.from(
    document.querySelectorAll<HTMLElement>("[data-folder-id]"),
  );
  for (const chip of chips) {
    const rect = chip.getBoundingClientRect();
    if (
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom
    ) {
      return chip.getAttribute("data-folder-id");
    }
  }
  return null;
}

function onPointerMove(event: PointerEvent) {
  if (!dragState.item) return;
  const deltaX = event.pageX - dragState.startX;
  const deltaY = event.pageY - dragState.startY;
  if (
    !dragState.isDragging &&
    (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold)
  ) {
    dragState.isDragging = true;
    createDragPreview(dragState.items.length);
    // Let pointer events pass through the gallery the moment the drag begins, so
    // the item can be dropped anywhere — including under the modal. The panel
    // eases to translucent (reopen on) or all the way out (reopen off) via the
    // Modal's contentDimmed/contentHidden, so the transition is never abrupt.
    galleryModalDraggingUnder.value = true;
  }
  dragState.currX = event.pageX;
  dragState.currY = event.pageY;

  if (dragState.isDragging) {
    updateDragPreviewPosition(event.clientX, event.clientY);

    // Highlight the folder under the cursor (if any) — folders still accept
    // drops even while the gallery is dimmed.
    const overFolder = folderIdAt(event.clientX, event.clientY);
    document.querySelectorAll("[data-folder-id]").forEach((el) => {
      el.classList.toggle(
        "folder-drag-over",
        el.getAttribute("data-folder-id") === overFolder,
      );
    });
  }
}

export const IMAGE_DROP_EVENT = "gallery-image-drop";
export const FOLDER_DROP_EVENT = "gallery-folder-drop";

export function emitImageDrop(
  item: GalleryItem,
  position: { x: number; y: number },
) {
  window.dispatchEvent(
    new CustomEvent(IMAGE_DROP_EVENT, { detail: { item, position } }),
  );
}

export function emitFolderDrop(items: GalleryItem[], folderId: string) {
  window.dispatchEvent(
    new CustomEvent(FOLDER_DROP_EVENT, { detail: { items, folderId } }),
  );
}

export function onImageDrop(
  callback: (item: GalleryItem, position: { x: number; y: number }) => void,
) {
  const handler = (e: any) => {
    callback(e.detail.item, e.detail.position);
  };
  window.addEventListener(IMAGE_DROP_EVENT, handler);
  return handler;
}

export function removeImageDropListener(handler: (e: any) => void) {
  window.removeEventListener(IMAGE_DROP_EVENT, handler);
}

export function onFolderDrop(
  callback: (items: GalleryItem[], folderId: string) => void,
) {
  const handler = (e: any) => {
    callback(e.detail.items, e.detail.folderId);
  };
  window.addEventListener(FOLDER_DROP_EVENT, handler);
  return handler;
}

export function removeFolderDropListener(handler: (e: any) => void) {
  window.removeEventListener(FOLDER_DROP_EVENT, handler);
}

function onPointerUp(event: PointerEvent) {
  // When closing after an add (reopen off), keep `draggingUnder` true so the
  // panel stays faded-out through the close — clearing it would race the close
  // animation and flash the hidden panel back up.
  let closedHidden = false;

  if (dragState.item && dragState.isDragging) {
    const folderId = folderIdAt(event.clientX, event.clientY);
    if (folderId) {
      // Dropped onto a folder — organize, and keep the gallery open.
      emitFolderDrop(dragState.items, folderId);
      spawnDropRipple(event.clientX, event.clientY);
    } else if (
      dragState.item.mediaClass === "image" ||
      dragState.item.mediaClass === "dimensional"
    ) {
      // Dropped onto the canvas (anywhere not on a folder) — add to the scene.
      emitImageDrop(dragState.item, { x: event.pageX, y: event.pageY });
      spawnDropRipple(event.clientX, event.clientY);
      // Close the gallery after adding unless the user asked it to stay open.
      if (!galleryReopenAfterDragSignal.value) {
        galleryModalVisibleViewMode.value = false;
        closedHidden = true;
      }
    }
  }

  // Cleanup
  removeDragPreview();

  document.querySelectorAll("[data-folder-id]").forEach((el) => {
    el.classList.remove("folder-drag-over");
  });

  dragState.item = null;
  dragState.items = [];
  dragState.isDragging = false;

  // Refocus the gallery (un-dim, restore pointer events) — unless it's closing,
  // in which case it stays faded until reopened (reset on open).
  if (!closedHidden) {
    galleryModalDraggingUnder.value = false;
  }

  document.body.style.cursor = "";
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", onPointerUp);
}

function getDragState() {
  return dragState;
}

const galleryDnd = {
  onPointerDown,
  getDragState,
};

export default galleryDnd;
