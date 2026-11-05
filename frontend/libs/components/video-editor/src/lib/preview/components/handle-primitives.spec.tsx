import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { CornerHandle, EdgeHandle } from "./handle-primitives";

// The preview's resize and rotate handles all render through HandleButton. A
// handle drag is ended by `onPointerUp`, and the button also ends it on
// `onPointerLeave`. That second hook is what recovers a touch or pen gesture the
// browser cancels: a browser fires "pointercancel" and then "pointerout" and
// "pointerleave" and never "pointerup". If the leave hook is ever removed, a
// cancelled gesture leaves the controller mid-drag with an uncommitted preview.
// This spec pins that contract (it is a regression guard; it passed before the
// change that added it, so it is not counted as a bug fix).

beforeAll(() => {
  // jsdom has no PointerEvent. Without one, fireEvent falls back to a plain
  // Event and fields such as `relatedTarget` are lost.
  if (!("PointerEvent" in window)) {
    Object.defineProperty(window, "PointerEvent", {
      configurable: true,
      value: class PointerEvent extends MouseEvent {},
    });
  }
});

afterEach(() => {
  cleanup();
});

function renderCorner() {
  const onPointerDown = vi.fn();
  const onPointerMove = vi.fn();
  const onPointerUp = vi.fn();
  render(
    <CornerHandle
      screen={{ x: 50, y: 50 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    />,
  );
  return { button: screen.getByRole("button"), onPointerUp, onPointerMove };
}

describe("handle primitives end a drag", () => {
  it("on pointerup", () => {
    const { button, onPointerUp } = renderCorner();
    fireEvent.pointerUp(button);
    expect(onPointerUp).toHaveBeenCalledTimes(1);
  });

  it("when the pointer leaves, which is what follows a pointercancel", () => {
    const { button, onPointerUp } = renderCorner();
    // The browser sequence after a cancel: pointercancel, then pointerout from
    // the handle with no related target (the pointer left the page).
    fireEvent.pointerCancel(button);
    fireEvent.pointerOut(button, { relatedTarget: null });
    expect(onPointerUp).toHaveBeenCalledTimes(1);
  });

  it("does not end the drag while the pointer only moves over the handle", () => {
    const { button, onPointerUp, onPointerMove } = renderCorner();
    fireEvent.pointerMove(button);
    expect(onPointerMove).toHaveBeenCalledTimes(1);
    expect(onPointerUp).not.toHaveBeenCalled();
  });

  it("applies to edge handles too", () => {
    const onPointerUp = vi.fn();
    render(
      <EdgeHandle
        edge="right"
        rotation={0}
        screen={{ x: 10, y: 10 }}
        onPointerDown={vi.fn()}
        onPointerMove={vi.fn()}
        onPointerUp={onPointerUp}
      />,
    );
    fireEvent.pointerOut(screen.getByRole("button"), { relatedTarget: null });
    expect(onPointerUp).toHaveBeenCalledTimes(1);
  });
});
