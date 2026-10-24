import { cleanup, renderHook } from "@testing-library/react";
import { Vector2 } from "three";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useViewportPointer } from "./useViewportPointer";

// jsdom has no PointerEvent. A MouseEvent already carries button / clientX /
// clientY, so it stands in for every pointer event dispatched below.
function pointerEvent(type: string, init: { button?: number } = {}): MouseEvent {
  return new MouseEvent(type, { bubbles: true, cancelable: true, ...init });
}

// Mount the hook against a real canvas and a fake editor whose mouse_controls
// are spies. The spies tell each test which calls the hook forwarded.
function mountViewportPointer() {
  const canvas = document.createElement("canvas");
  document.body.appendChild(canvas);

  const mouseControls = {
    onMouseMove: vi.fn(),
    onMouseDown: vi.fn(),
    onMouseUp: vi.fn(),
    onMouseClick: vi.fn(),
  };
  const editor = {
    mouse: new Vector2(),
    mouse_controls: mouseControls,
    cameraController: { enterCameraView: vi.fn(), exitCameraView: vi.fn() },
    sceneManager: { selected_objects: [] },
  };

  const view = renderHook(() => useViewportPointer(canvas, editor as never));
  return { canvas, mouseControls, unmount: view.unmount };
}

afterEach(() => {
  // Unmount the hook (removes its listeners) and clear the DOM between tests.
  cleanup();
  document.body.innerHTML = "";
});

describe("useViewportPointer press and release", () => {
  it("forwards a press and a release to the mouse controls", () => {
    const { canvas, mouseControls } = mountViewportPointer();

    canvas.dispatchEvent(pointerEvent("pointerdown", { button: 0 }));
    canvas.dispatchEvent(pointerEvent("pointerup", { button: 0 }));

    expect(mouseControls.onMouseDown).toHaveBeenCalledTimes(1);
    expect(mouseControls.onMouseUp).toHaveBeenCalledTimes(1);
  });

  it("releases the primary button when the pointer is cancelled instead of released", () => {
    const { canvas, mouseControls } = mountViewportPointer();

    // A touch or pen gesture starts on the canvas, then the browser takes it
    // over (a system gesture, palm rejection) and fires pointercancel. No
    // pointerup ever arrives, so without this the controls keep "mouse down".
    canvas.dispatchEvent(pointerEvent("pointerdown", { button: 0 }));
    canvas.dispatchEvent(pointerEvent("pointercancel"));

    // The controls must be told the press ended, as a primary-button release.
    // (Old code had no pointercancel listener, so onMouseUp was never called.)
    expect(mouseControls.onMouseUp).toHaveBeenCalledTimes(1);
    expect(mouseControls.onMouseUp).toHaveBeenCalledWith(
      expect.objectContaining({ button: 0 }),
    );
  });

  it("stops listening for pointercancel after the hook unmounts", () => {
    const { canvas, mouseControls, unmount } = mountViewportPointer();

    unmount();
    canvas.dispatchEvent(pointerEvent("pointercancel"));

    expect(mouseControls.onMouseUp).not.toHaveBeenCalled();
  });
});
