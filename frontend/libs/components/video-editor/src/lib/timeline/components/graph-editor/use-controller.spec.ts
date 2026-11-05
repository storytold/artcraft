import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// vi.hoisted runs before the imports below, so the mocks can share these spies.
const mocks = vi.hoisted(() => {
  const timeline = {
    getPreviewTracks: () => null,
    previewElements: vi.fn(),
    discardPreview: vi.fn(),
    updateKeyframeCurves: vi.fn(),
  };
  const editor = {
    timeline,
    scenes: { getActiveScene: () => ({ tracks: {} }) },
  };
  return { timeline, editor };
});

// useEditor() with no argument returns the editor; with a selector it returns
// whatever the selector picks from it. This stand-in supports both.
vi.mock("../../../editor/use-editor", () => ({
  useEditor: (selector?: (editor: unknown) => unknown) =>
    selector ? selector(mocks.editor) : mocks.editor,
}));
vi.mock("../../../editor/cancel-interaction", () => ({
  registerCanceller: () => () => {},
}));

// A fixed, never-changing list so memoised values stay stable between renders.
const NO_KEYFRAMES: never[] = [];
vi.mock("../../hooks/element/use-keyframe-selection", () => ({
  useKeyframeSelection: () => ({ selectedKeyframes: NO_KEYFRAMES }),
}));

// The session helpers do the real curve maths. They are not what is under
// test, so return a fixed "ready" selection and pass animations through.
const READY_STATE = {
  status: "ready",
  trackId: "track-1",
  elementId: "el-1",
  activeComponentKey: "value",
  element: { animations: {} },
  segments: [
    {
      propertyPath: "opacity",
      keyframeId: "kf-1",
      referenceSpanValue: 1,
      context: { componentKey: "value" },
      allContexts: [{ componentKey: "value" }],
    },
  ],
};
vi.mock("./session", () => ({
  resolveGraphEditorSelectionState: () => READY_STATE,
  applyGraphEditorCurvePreview: ({ animations }: { animations: unknown }) =>
    animations,
  buildGraphEditorCurvePatches: () => null,
}));

import { useGraphEditorController } from "./use-controller";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("useGraphEditorController unmount", () => {
  it("discards a live curve preview when the hook unmounts mid-drag", () => {
    const { result, unmount } = renderHook(() => useGraphEditorController());

    // Arrange: the user drags a bezier handle, which previews the new curve
    // in the shared editor without committing it.
    act(() => result.current.onPreviewValue([0.25, 0.1, 0.25, 1]));
    expect(mocks.timeline.previewElements).toHaveBeenCalledTimes(1);
    expect(mocks.timeline.discardPreview).not.toHaveBeenCalled();

    // Act: the toolbar unmounts before the drag is committed or cancelled.
    unmount();

    // Assert: the preview was thrown away. Without this it stays in the
    // editor and the next commitPreview() from another tool saves it.
    expect(mocks.timeline.discardPreview).toHaveBeenCalledTimes(1);
  });

  it("does not discard anything on unmount when no preview is live", () => {
    const { unmount } = renderHook(() => useGraphEditorController());

    // Nothing was previewed, so another tool's preview must be left alone
    // (this is also what React StrictMode's mount/cleanup/mount hits).
    unmount();

    expect(mocks.timeline.discardPreview).not.toHaveBeenCalled();
  });

  it("does not discard after the preview was committed", () => {
    const { result, unmount } = renderHook(() => useGraphEditorController());

    act(() => result.current.onPreviewValue([0.25, 0.1, 0.25, 1]));
    act(() => result.current.onCommitValue([0.25, 0.1, 0.25, 1]));
    expect(mocks.timeline.updateKeyframeCurves).toHaveBeenCalledTimes(1);

    // The commit already finished the preview, so unmount has nothing to do.
    unmount();

    expect(mocks.timeline.discardPreview).not.toHaveBeenCalled();
  });
});
