import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// galleryDnd only imports the GalleryItem type from here; stub the heavy module.
vi.mock("./gallery-modal", () => ({}));

import galleryDnd, { IMAGE_DROP_EVENT } from "./galleryDnd";
import {
  galleryDragHidesImmediately,
  galleryModalDraggingUnder,
} from "./galleryModalSignals";

// jsdom 22 has no PointerEvent, so build a MouseEvent and add pageX/pageY.
const fire = (type: string, x: number, y: number) => {
  const ev = new MouseEvent(type, { clientX: x, clientY: y, bubbles: true });
  Object.defineProperty(ev, "pageX", { value: x });
  Object.defineProperty(ev, "pageY", { value: y });
  window.dispatchEvent(ev);
};

const item = { id: "m1", mediaClass: "image" } as never;

// Starts a drag and moves past the 5px threshold so the drag is "live".
const startLiveDrag = () => {
  galleryDnd.onPointerDown(
    { button: 0, pageX: 0, pageY: 0 } as never,
    item,
    [item, { id: "m2", mediaClass: "image" } as never],
  );
  fire("pointermove", 40, 40);
};

describe("galleryDnd pointercancel", () => {
  const onDrop = vi.fn();

  beforeEach(() => {
    galleryDragHidesImmediately.value = true;
    galleryModalDraggingUnder.value = false;
    window.addEventListener(IMAGE_DROP_EVENT, onDrop);
  });
  afterEach(() => {
    // Always finish any drag a test left behind. pointercancel (not pointerup)
    // so no drop ripple runs, since jsdom has no Element.animate.
    fire("pointercancel", 0, 0);
    window.removeEventListener(IMAGE_DROP_EVENT, onDrop);
    onDrop.mockClear();
    galleryDragHidesImmediately.value = false;
    document.body.innerHTML = "";
  });

  it("puts the app into a dragging state once the pointer moves past the threshold", () => {
    startLiveDrag();
    expect(galleryDnd.getDragState().isDragging).toBe(true);
    expect(galleryModalDraggingUnder.value).toBe(true);
    expect(document.body.style.cursor).toBe("grabbing");
    // Count chip for the 2-item bulk drag.
    expect(document.body.textContent).toBe("2");
  });

  it("fully ends the drag on pointercancel without dropping anything", () => {
    startLiveDrag();
    fire("pointercancel", 40, 40);

    // Before the fix none of this was reset: the modal stayed faded and
    // pointer-transparent, the cursor stayed grabbing and the chip stayed.
    expect(galleryDnd.getDragState().isDragging).toBe(false);
    expect(galleryDnd.getDragState().item).toBeNull();
    expect(galleryModalDraggingUnder.value).toBe(false);
    expect(document.body.style.cursor).toBe("");
    expect(document.body.textContent).toBe("");
    expect(onDrop).not.toHaveBeenCalled();
  });

  it("ignores later pointer moves after a cancel (listeners were removed)", () => {
    startLiveDrag();
    fire("pointercancel", 40, 40);
    fire("pointermove", 200, 200);
    expect(galleryDnd.getDragState().isDragging).toBe(false);
    expect(galleryModalDraggingUnder.value).toBe(false);
    expect(document.body.textContent).toBe("");
  });
});
