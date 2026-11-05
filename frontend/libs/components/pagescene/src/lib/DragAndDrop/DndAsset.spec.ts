import { afterEach, describe, expect, it, vi } from "vitest";

import dragAndDrop from "./DndAsset";
import { usePageSceneStore } from "../PageSceneStore";
import { AssetType } from "../enums";
import type { MediaItem } from "../models";

// The drop helpers pull in the whole editor stack. This spec only cares about
// the pointer bookkeeping, so replace them with spies we can assert on.
const actions = vi.hoisted(() => ({
  addCharacter: vi.fn(),
  addClipToCharacter: vi.fn(),
  addObject: vi.fn(),
  addShape: vi.fn(),
}));
vi.mock("../actions", () => actions);

// jsdom has no PointerEvent, so build plain events and attach the fields the
// code reads (pageX / pageY) by hand.
function pointerEvent(type: string, pageX = 0, pageY = 0): MouseEvent {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, "pageX", { value: pageX });
  Object.defineProperty(event, "pageY", { value: pageY });
  return event;
}

const item = {
  media_id: "m_rock",
  name: "Rock",
  type: AssetType.OBJECT,
} as unknown as MediaItem;

// A just-enough Editor: DndAsset only reads the viewport size from it while a
// non-animation drag is in flight.
const fakeEditor = {
  adapter: { getViewportSize: () => ({ width: 1000, height: 800 }) },
} as never;

// Simulate pressing on a library card (pointerdown) at (100, 100).
function pressCard() {
  dragAndDrop.onPointerDown(
    { button: 0, pageX: 100, pageY: 100 } as never,
    item,
    fakeEditor,
  );
}

afterEach(() => {
  // The store and the DndAsset singleton are module-level and shared by every
  // test, so put them back to their idle values.
  window.dispatchEvent(pointerEvent("pointerup"));
  usePageSceneStore.setState({
    dragItem: null,
    dragPosition: { currX: 0, currY: 0 },
    assetDraggingUnder: false,
    reopenAfterDrag: false,
    assetModalVisible: false,
    animationsModalVisible: false,
  });
  dragAndDrop.isDragging = false;
  vi.clearAllMocks();
});

describe("DndAsset pointercancel", () => {
  it("ends an in-flight drag without dropping the asset", () => {
    // Arrange: press a card and move far enough that a real drag begins.
    usePageSceneStore.setState({ reopenAfterDrag: true });
    pressCard();
    window.dispatchEvent(pointerEvent("pointermove", 300, 300));
    expect(dragAndDrop.isDragging).toBe(true);
    expect(usePageSceneStore.getState().dragItem).toBe(item);
    expect(usePageSceneStore.getState().assetDraggingUnder).toBe(true);

    // Act: the OS interrupts the touch/pen gesture - the browser sends
    // pointercancel and will NEVER send pointerup.
    window.dispatchEvent(pointerEvent("pointercancel"));

    // Assert: the drag is fully over (ghost gone, library un-dimmed)...
    expect(dragAndDrop.isDragging).toBe(false);
    expect(usePageSceneStore.getState().dragItem).toBeNull();
    expect(usePageSceneStore.getState().assetDraggingUnder).toBe(false);
    // ...and nothing was added to the scene, even if a stray pointerup
    // arrives afterwards.
    window.dispatchEvent(pointerEvent("pointerup", 300, 300));
    expect(actions.addObject).not.toHaveBeenCalled();
  });

  it("clears a press that never became a drag and stops tracking the pointer", () => {
    // Arrange: press a card but do not move past the drag threshold.
    pressCard();
    expect(usePageSceneStore.getState().dragItem).toBe(item);

    // Act: the gesture is cancelled.
    window.dispatchEvent(pointerEvent("pointercancel"));

    // Assert: the pending press is cleared...
    expect(usePageSceneStore.getState().dragItem).toBeNull();

    // ...and the window pointermove listener is gone: with a drag item put
    // back in the store, a far-away move must NOT start a drag any more.
    usePageSceneStore.setState({ dragItem: item });
    window.dispatchEvent(pointerEvent("pointermove", 900, 700));
    expect(dragAndDrop.isDragging).toBe(false);
    expect(usePageSceneStore.getState().dragPosition).toEqual({
      currX: 0,
      currY: 0,
    });
  });
});
