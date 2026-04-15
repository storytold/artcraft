import { GalleryItem } from "./gallery-modal";
import {
  galleryModalVisibleDuringDrag,
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
  modalHidden: boolean;
}

const dragState: DragState = {
  item: null,
  items: [],
  isDragging: false,
  startX: 0,
  startY: 0,
  currX: 0,
  currY: 0,
  modalHidden: false,
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
  dragState.modalHidden = false;
  document.body.style.cursor = "grabbing";
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
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
  }
  dragState.currX = event.pageX;
  dragState.currY = event.pageY;

  if (dragState.isDragging) {
    updateDragPreviewPosition(event.clientX, event.clientY);
  }

  if (dragState.isDragging && !dragState.modalHidden) {
    // Check if cursor left the modal area - if so, hide modal for scene drop
    const modalEl = document.querySelector("[data-gallery-modal]");
    if (modalEl) {
      const rect = modalEl.getBoundingClientRect();
      const isOutside =
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom;
      if (isOutside) {
        dragState.modalHidden = true;
        galleryModalVisibleDuringDrag.value = false;
      }
    }

    // Update folder hover indicators while inside the modal
    if (!dragState.modalHidden) {
      const folderEl = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest("[data-folder-id]");
      document.querySelectorAll("[data-folder-id]").forEach((el) => {
        el.classList.toggle("folder-drag-over", el === folderEl);
      });
    }
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
  const wasModalHidden = dragState.modalHidden;

  if (dragState.item && dragState.isDragging) {
    if (!dragState.modalHidden) {
      // Still inside modal - check for folder drop
      const folderEl = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest("[data-folder-id]");
      if (folderEl) {
        const folderId = folderEl.getAttribute("data-folder-id")!;
        emitFolderDrop(dragState.items, folderId);
      }
    } else {
      // Modal was hidden - scene drop (existing behavior)
      if (
        dragState.item.mediaClass === "image" ||
        dragState.item.mediaClass === "dimensional"
      ) {
        emitImageDrop(dragState.item, { x: event.pageX, y: event.pageY });
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
  dragState.modalHidden = false;

  if (wasModalHidden) {
    galleryModalVisibleDuringDrag.value = galleryReopenAfterDragSignal.value;
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
