// Spec for GlobalFileDropHandler's desktop (Tauri) drag-and-drop subscription.
//
// What is being protected: the component subscribes to the native window's drag-drop events inside an
// async function. If the component is removed (unmounted) while that subscription is still being set up,
// the unsubscribe ("unlisten") function must STILL be called once it arrives, otherwise the listener
// leaks and every later drop is handled by a component that no longer exists (or twice, in React
// StrictMode, which mounts, unmounts and re-mounts every component in development).

import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The component decides "am I inside the Tauri desktop shell?" once, when its module is first loaded, by
// checking for window.__TAURI__. vi.hoisted runs before the imports below, so the flag is already set.
vi.hoisted(() => {
  (window as unknown as { __TAURI__: object }).__TAURI__ = {};
});

const mocks = vi.hoisted(() => ({
  // Stand-in for appWindow.onDragDropEvent: returns a promise of an "unlisten" function.
  onDragDropEvent: vi.fn(),
}));

vi.mock("@tauri-apps/api/webviewWindow", () => ({
  getCurrentWebviewWindow: () => ({
    onDragDropEvent: mocks.onDragDropEvent,
    setFocus: vi.fn(),
  }),
}));
vi.mock("@tauri-apps/api/core", () => ({ convertFileSrc: (p: string) => p }));
vi.mock("react-hot-toast", () => ({ toast: vi.fn() }));
// The three upload modals are not under test; render nothing for them.
vi.mock("@storyteller/ui-upload-modal", () => ({
  UploadModal3D: () => null,
  UploadModalImage: () => null,
  UploadModalSplat: () => null,
}));
vi.mock("@storyteller/ui-promptbox", () => ({
  isPromptBoxDropZoneActive: () => false,
}));

import { GlobalFileDropHandler } from "./GlobalFileDropHandler";

// A promise we resolve by hand, so a test decides exactly WHEN the subscription "arrives".
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

beforeEach(() => {
  mocks.onDragDropEvent.mockReset();
  // The component logs setup problems; keep test output quiet.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("GlobalFileDropHandler native drag-drop subscription", () => {
  it("unlistens when the component unmounts normally", async () => {
    // Arrange: the subscription resolves right away with an unlisten function we can watch.
    const unlisten = vi.fn();
    mocks.onDragDropEvent.mockResolvedValue(unlisten);
    const { unmount } = render(<GlobalFileDropHandler />);
    await waitFor(() => expect(mocks.onDragDropEvent).toHaveBeenCalledTimes(1));
    // Let the subscription's promise settle so the component has stored its unlisten function.
    await act(async () => {
      await Promise.resolve();
    });

    // Act
    unmount();

    // Assert: the normal cleanup path still works.
    expect(unlisten).toHaveBeenCalledTimes(1);
  });

  it("unlistens a subscription that arrives AFTER the component unmounted", async () => {
    // Arrange: the subscription is still pending (we hold the promise) when the component goes away.
    const unlisten = vi.fn();
    const pending = deferred<() => void>();
    mocks.onDragDropEvent.mockReturnValue(pending.promise);
    const { unmount } = render(<GlobalFileDropHandler />);
    await waitFor(() => expect(mocks.onDragDropEvent).toHaveBeenCalledTimes(1));

    // Act: unmount first (cleanup runs with nothing to unlisten yet), then let the subscription arrive.
    unmount();
    await act(async () => {
      pending.resolve(unlisten);
    });

    // Assert: the late subscription was released instead of leaking.
    expect(unlisten).toHaveBeenCalledTimes(1);
  });

  // Note: a "mount, unmount, mount again" (React StrictMode style) test was tried too. vitest hands the
  // second, overlapping dynamic import of the mocked Tauri module the REAL module, which throws outside
  // the desktop app, so that variant cannot run here. The test above covers the same mechanism
  // deterministically: cleanup runs before the subscription arrives, and the late unlisten must still fire.
});
