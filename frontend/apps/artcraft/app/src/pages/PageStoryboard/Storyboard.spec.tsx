import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { Storyboard } from "./Storyboard";
import { useStoryboardStore, type Board } from "./StoryboardStore";

// The Storyboard timeline has two pointer drags that listen on `window`: dragging
// the right edge of a shot to resize it, and dragging a shot to reorder it. Both
// ended on "pointerup" only. A touch or pen gesture the browser takes over (it
// starts to pan the timeline) ends with "pointercancel" and never "pointerup", so
// the drag stayed alive: later mouse moves kept resizing the shot, and the next
// pointerup anywhere (a plain click) was taken for the end of the reorder drag.

beforeAll(() => {
  // jsdom has no PointerEvent. Without one, fireEvent falls back to a plain
  // Event and the `button`/`clientX` fields are lost.
  if (!("PointerEvent" in window)) {
    Object.defineProperty(window, "PointerEvent", {
      configurable: true,
      value: class PointerEvent extends MouseEvent {},
    });
  }
});

function makeBoard(id: string, shotNumber: number): Board {
  return {
    id,
    imageDataUrl: null,
    title: `shot-${id}`,
    shotNumber,
    dialogue: "",
    action: "",
    notes: "",
    duration: 3,
  };
}

// Window-level pointer events, the way the real handlers receive them.
function firePointer(type: string, clientX = 0) {
  act(() => {
    window.dispatchEvent(new MouseEvent(type, { bubbles: true, clientX }));
  });
}

function order(): string[] {
  return useStoryboardStore.getState().boards.map((b) => b.id);
}

function durationOf(id: string): number {
  return useStoryboardStore.getState().boards.find((b) => b.id === id)!.duration;
}

describe("Storyboard timeline drags", () => {
  let container: HTMLElement;

  beforeEach(() => {
    useStoryboardStore.setState({
      boards: [makeBoard("a", 1), makeBoard("b", 2), makeBoard("c", 3)],
      selectedBoardId: "a",
    });
    container = render(<Storyboard />).container;
  });

  afterEach(() => {
    // Release any drag a test left open (the listeners live on `window`, which
    // every test in this file shares), then reset the store.
    firePointer("pointerup");
    cleanup();
    useStoryboardStore.getState().reset();
  });

  function resizeHandle(index: number): Element {
    return container.querySelectorAll('[data-resize="true"]')[index];
  }

  // The shot block is the resize handle's parent.
  function shotBlock(index: number): Element {
    return resizeHandle(index).parentElement!;
  }

  it("resizes a shot while the pointer moves and stops on pointerup", () => {
    fireEvent.pointerDown(resizeHandle(0), { button: 0, clientX: 100 });
    firePointer("pointermove", 180); // +80px = +1s
    expect(durationOf("a")).toBe(4);

    firePointer("pointerup");
    firePointer("pointermove", 400);
    expect(durationOf("a")).toBe(4);
  });

  it("stops resizing when the browser cancels the gesture", () => {
    fireEvent.pointerDown(resizeHandle(0), { button: 0, clientX: 100 });
    firePointer("pointermove", 180);
    expect(durationOf("a")).toBe(4);

    // The browser took the gesture over: pointercancel, no pointerup.
    firePointer("pointercancel");

    // A later hover must not keep resizing the shot. (Old code kept the
    // pointermove listener, so this moved the duration to 6.8.)
    firePointer("pointermove", 400);
    expect(durationOf("a")).toBe(4);
  });

  it("reorders a shot on pointerup", () => {
    fireEvent.pointerDown(shotBlock(0), { button: 0 });
    firePointer("pointermove", 700); // past the last shot
    firePointer("pointerup");
    expect(order()).toEqual(["b", "c", "a"]);
  });

  it("drops a cancelled reorder drag instead of applying it on the next pointerup", () => {
    fireEvent.pointerDown(shotBlock(0), { button: 0 });
    firePointer("pointermove", 700);
    // The insertion caret is showing while the drag is live.
    expect(container.querySelector(".bg-yellow-400")).not.toBeNull();

    firePointer("pointercancel");

    // The drag is over: no caret, nothing reordered.
    expect(container.querySelector(".bg-yellow-400")).toBeNull();
    expect(order()).toEqual(["a", "b", "c"]);

    // ... and an unrelated pointerup later (any click) must not finish it.
    // (Old code reordered to b, c, a here.)
    firePointer("pointerup");
    expect(order()).toEqual(["a", "b", "c"]);
  });
});
