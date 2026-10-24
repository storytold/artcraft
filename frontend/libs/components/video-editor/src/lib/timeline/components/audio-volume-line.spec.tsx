import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

// vi.hoisted runs before the imports below, so the mocks can share these spies.
const mocks = vi.hoisted(() => {
  const timeline = {
    previewElements: vi.fn(),
    commitPreview: vi.fn(),
    discardPreview: vi.fn(),
  };
  const editor = {
    timeline,
    selection: { setSelectedElements: vi.fn() },
  };
  return { timeline, editor };
});

vi.mock("../../editor/use-editor", () => ({
  useEditor: () => mocks.editor,
}));

// Fixed numbers keep the test independent of the real dB <-> line maths.
// The clip starts at 0 dB; any pointer position maps to -6 dB.
vi.mock("../audio-display", () => ({
  getDbFromLinePos: () => -6,
  getLinePosFromDb: () => 50,
}));
vi.mock("../audio-state", () => ({
  getElementVolume: () => 0,
  hasAnimatedVolume: () => false,
}));

import { AudioVolumeLine } from "./audio-volume-line";
import type { AudioElement } from "../types";

const element = { id: "el-1" } as unknown as AudioElement;

beforeAll(() => {
  // jsdom has no pointer-capture API; the component calls it on pointerdown.
  Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
    value: vi.fn(),
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// jsdom has no PointerEvent, so build a MouseEvent and attach pointerId.
function pointerEvent(type: string, pointerId = 1): MouseEvent {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX: 10,
    clientY: 10,
  });
  Object.defineProperty(event, "pointerId", { value: pointerId });
  return event;
}

function renderLine() {
  const utils = render(<AudioVolumeLine element={element} trackId="track-1" />);
  const hitArea = utils.getByTitle("Drag to adjust clip volume");
  return { ...utils, hitArea };
}

describe("AudioVolumeLine unmount", () => {
  it("discards the volume preview when unmounted in the middle of a drag", () => {
    const { hitArea, unmount } = renderLine();

    // Arrange: the user presses the volume line, which previews -6 dB in the
    // shared editor without committing it.
    fireEvent(hitArea, pointerEvent("pointerdown"));
    expect(mocks.timeline.previewElements).toHaveBeenCalledTimes(1);
    expect(mocks.timeline.discardPreview).not.toHaveBeenCalled();

    // Act: the clip disappears (deleted, or the timeline closes) before the
    // pointer is released, so no pointerup/cancel will ever arrive.
    unmount();

    // Assert: the leftover preview was thrown away.
    expect(mocks.timeline.discardPreview).toHaveBeenCalledTimes(1);
    expect(mocks.timeline.commitPreview).not.toHaveBeenCalled();
  });

  it("does not discard anything when unmounted with no drag in progress", () => {
    const { unmount } = renderLine();

    // No drag, so another tool's preview must be left alone (this is also
    // what React StrictMode's mount/cleanup/mount hits).
    unmount();

    expect(mocks.timeline.discardPreview).not.toHaveBeenCalled();
  });

  it("does not discard after the drag finished normally", () => {
    const { hitArea, unmount } = renderLine();

    fireEvent(hitArea, pointerEvent("pointerdown"));
    fireEvent(hitArea, pointerEvent("pointerup"));
    expect(mocks.timeline.commitPreview).toHaveBeenCalledTimes(1);

    // The drag already ended (committed), so unmount has nothing to clean up.
    unmount();

    expect(mocks.timeline.discardPreview).not.toHaveBeenCalled();
  });
});
