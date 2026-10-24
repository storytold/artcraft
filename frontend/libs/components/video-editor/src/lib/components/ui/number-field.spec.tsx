import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { NumberField } from "./number-field";

// The drag-to-scrub icon on a NumberField locks the pointer and listens on the
// document for pointermove until the pointer is released. A touch or pen gesture
// the browser takes over (for example it starts to pan the panel) ends with
// "pointercancel" and never "pointerup", so a missing cancel handler leaves the
// move listener attached for good.

beforeAll(() => {
  // jsdom has no PointerEvent. Without one, fireEvent falls back to a plain
  // Event and the `button` field the handler checks is lost.
  if (!("PointerEvent" in window)) {
    Object.defineProperty(window, "PointerEvent", {
      configurable: true,
      value: class PointerEvent extends MouseEvent {},
    });
  }
  // ... and no pointer lock either.
  Object.defineProperty(HTMLElement.prototype, "requestPointerLock", {
    configurable: true,
    value: vi.fn(),
  });
});

// A pointermove carrying the relative movement the handler reads.
function movePointer(movementX: number) {
  const event = new MouseEvent("pointermove", { bubbles: true });
  Object.defineProperty(event, "movementX", { value: movementX });
  document.dispatchEvent(event);
}

describe("NumberField drag-to-scrub", () => {
  const onScrub = vi.fn();
  const onScrubEnd = vi.fn();
  const exitPointerLock = vi.fn();

  beforeEach(() => {
    onScrub.mockReset();
    onScrubEnd.mockReset();
    exitPointerLock.mockReset();
    Object.defineProperty(document, "exitPointerLock", {
      configurable: true,
      value: exitPointerLock,
    });
    render(
      <NumberField
        icon={<span>X</span>}
        value="10"
        onChange={() => {}}
        onScrub={onScrub}
        onScrubEnd={onScrubEnd}
      />,
    );
    fireEvent.pointerDown(screen.getByLabelText("Drag to adjust value"), {
      button: 0,
    });
  });

  afterEach(() => {
    // Release any drag a test left open: the listeners live on `document`, which
    // is shared by every test in this file.
    document.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
    cleanup();
  });

  it("scrubs the value while the pointer moves (the first move is the bogus pointer-lock warp)", () => {
    movePointer(100); // ignored on purpose
    expect(onScrub).not.toHaveBeenCalled();
    movePointer(5);
    expect(onScrub).toHaveBeenCalledTimes(1);
  });

  it("ends the scrub on pointerup", () => {
    movePointer(1);
    movePointer(1);
    document.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));

    expect(onScrubEnd).toHaveBeenCalledTimes(1);
    expect(exitPointerLock).toHaveBeenCalledTimes(1);

    onScrub.mockClear();
    movePointer(1);
    expect(onScrub).not.toHaveBeenCalled();
  });

  it("ends the scrub when the browser cancels the gesture, and stops following the pointer", () => {
    movePointer(1);
    movePointer(1);
    onScrub.mockClear();

    // The browser took the gesture over: pointercancel, no pointerup.
    document.dispatchEvent(new MouseEvent("pointercancel", { bubbles: true }));

    // The scrub is closed out: the host is told it ended and the lock is released.
    expect(onScrubEnd).toHaveBeenCalledTimes(1);
    expect(exitPointerLock).toHaveBeenCalledTimes(1);

    // ... and a later hover must not keep changing the value. (Old code kept the
    // pointermove listener, so every mouse move scrubbed the field.)
    movePointer(1);
    movePointer(1);
    expect(onScrub).not.toHaveBeenCalled();
  });
});
