import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { BoardGrid } from "./BoardGrid";

// jsdom has no ResizeObserver; BoardGrid measures its scroll container with one.
class FakeResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// jsdom 22 has no PointerEvent: build a generic mouse event with the pointer
// event name. React and the window listeners only read button / client coords.
const pointer = (type: string, x = 0, y = 0, extra: MouseEventInit = {}) =>
  new MouseEvent(type, { clientX: x, clientY: y, bubbles: true, ...extra });

const renderGrid = (strict = false) => {
  const onSelectMany = vi.fn();
  const onClearSelection = vi.fn();
  const grid = (
    <BoardGrid
      items={[]}
      density="cozy"
      selectedIds={new Set()}
      onSelect={vi.fn()}
      onSelectMany={onSelectMany}
      onClearSelection={onClearSelection}
      onOpen={vi.fn()}
      onUseReference={vi.fn()}
      onDelete={vi.fn()}
    />
  );
  const utils = render(strict ? <StrictMode>{grid}</StrictMode> : grid);
  // The scroll container is the root element, i.e. the "bare canvas".
  const canvas = utils.container.firstElementChild as HTMLElement;
  return { canvas, onSelectMany, onClearSelection };
};

describe("BoardGrid marquee selection", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  });
  afterEach(() => {
    // Releases any marquee a test left armed, then unmounts.
    fireEvent(window, pointer("pointercancel"));
    fireEvent(window, pointer("pointerup"));
    cleanup();
    vi.unstubAllGlobals();
  });

  it("drags a marquee and reports the selection once on release", () => {
    const { canvas, onSelectMany, onClearSelection } = renderGrid();
    fireEvent(canvas, pointer("pointerdown", 10, 10));
    fireEvent(window, pointer("pointermove", 80, 80));
    fireEvent(window, pointer("pointerup", 80, 80));
    expect(onSelectMany).toHaveBeenCalledTimes(1);
    expect(onClearSelection).not.toHaveBeenCalled();
  });

  it("clears the selection on a plain click of the empty canvas", () => {
    const { canvas, onSelectMany, onClearSelection } = renderGrid();
    fireEvent(canvas, pointer("pointerdown", 10, 10));
    fireEvent(window, pointer("pointerup", 10, 10));
    expect(onClearSelection).toHaveBeenCalledTimes(1);
    expect(onSelectMany).not.toHaveBeenCalled();
  });

  it("does not let a cancelled press clear the selection on the next unrelated pointerup", () => {
    const { canvas, onSelectMany, onClearSelection } = renderGrid();
    // A touch drag on the scrollable canvas: the browser takes it over for
    // scrolling and sends pointercancel, never pointerup.
    fireEvent(canvas, pointer("pointerdown", 10, 10));
    fireEvent(window, pointer("pointercancel", 10, 10));
    // Much later the user taps something else (e.g. a card).
    fireEvent(window, pointer("pointerup", 200, 200));
    expect(onClearSelection).not.toHaveBeenCalled();
    expect(onSelectMany).not.toHaveBeenCalled();
  });

  it("does not select from a marquee that was cancelled mid-drag", () => {
    const { canvas, onSelectMany, onClearSelection } = renderGrid();
    fireEvent(canvas, pointer("pointerdown", 10, 10));
    fireEvent(window, pointer("pointermove", 90, 90));
    fireEvent(window, pointer("pointercancel", 90, 90));
    fireEvent(window, pointer("pointerup", 90, 90));
    expect(onSelectMany).not.toHaveBeenCalled();
    expect(onClearSelection).not.toHaveBeenCalled();
  });

  it("reports the selection exactly once under StrictMode", () => {
    const { canvas, onSelectMany } = renderGrid(true);
    fireEvent(canvas, pointer("pointerdown", 10, 10));
    fireEvent(window, pointer("pointermove", 80, 80));
    fireEvent(window, pointer("pointerup", 80, 80));
    // The callbacks used to run inside the setMarquee updater, which React
    // StrictMode invokes twice.
    expect(onSelectMany).toHaveBeenCalledTimes(1);
  });
});
