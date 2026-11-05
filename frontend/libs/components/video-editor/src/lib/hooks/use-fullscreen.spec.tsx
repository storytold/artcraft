import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useFullscreen } from "./use-fullscreen";

// The preview panel's Full screen button asks its container element to go full screen. The desktop app's
// macOS webview ships with element full screen switched OFF unless Tauri's `macos-private-api` feature is on
// (Tauri docs: macOSPrivateApi "sets the fullScreenEnabled preference to true"; wry only sets it behind its
// `fullscreen` feature; this repo enables neither). There, document.fullscreenEnabled is false and the element
// has no usable requestFullscreen, so the button used to throw or do nothing at all. jsdom matches that webview:
// it implements no Fullscreen API, so a plain jsdom element is the "switched off" case.

// Set document.fullscreenEnabled for one test (jsdom does not define it, so the test restores it by deleting).
const setFullscreenEnabled = (value: boolean) => {
  Object.defineProperty(document, "fullscreenEnabled", {
    configurable: true,
    value,
  });
};

// Make document.fullscreenElement report `element` (null = nothing is full screen).
const setFullscreenElement = (element: Element | null) => {
  Object.defineProperty(document, "fullscreenElement", {
    configurable: true,
    value: element,
  });
};

afterEach(() => {
  // Remove every property a test added to document so the next test starts from jsdom's real (empty) state.
  Reflect.deleteProperty(document, "fullscreenEnabled");
  Reflect.deleteProperty(document, "fullscreenElement");
  Reflect.deleteProperty(document, "exitFullscreen");
});

describe("useFullscreen", () => {
  it("ignores a press when the webview has full screen switched off, instead of throwing", () => {
    // A container with no requestFullscreen, as in the webview without the preference.
    const container = document.createElement("div");
    const { result } = renderHook(() =>
      useFullscreen({ containerRef: { current: container } }),
    );

    // A press that still reaches the handler must not throw (it used to: "requestFullscreen is not a function").
    expect(() => result.current.toggleFullscreen()).not.toThrow();
  });

  it("reports full screen as unavailable when the webview has it switched off", () => {
    const container = document.createElement("div");
    const { result } = renderHook(() =>
      useFullscreen({ containerRef: { current: container } }),
    );

    // The panel reads this flag to leave the Full screen controls out.
    expect(result.current.isSupported).toBe(false);
  });

  it("reports full screen as available and asks the container to go full screen when a press arrives", () => {
    setFullscreenEnabled(true);
    const container = document.createElement("div");
    const requestFullscreen = vi.fn(async () => undefined);
    container.requestFullscreen = requestFullscreen;
    const { result } = renderHook(() =>
      useFullscreen({ containerRef: { current: container } }),
    );

    expect(result.current.isSupported).toBe(true);
    act(() => result.current.toggleFullscreen());

    expect(requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it("leaves full screen when the container is already full screen", () => {
    setFullscreenEnabled(true);
    const container = document.createElement("div");
    container.requestFullscreen = vi.fn(async () => undefined);
    // The document says the container is the full screen element.
    setFullscreenElement(container);
    const exitFullscreen = vi.fn(async () => undefined);
    document.exitFullscreen = exitFullscreen;
    const { result } = renderHook(() =>
      useFullscreen({ containerRef: { current: container } }),
    );

    act(() => result.current.toggleFullscreen());

    expect(exitFullscreen).toHaveBeenCalledTimes(1);
    expect(container.requestFullscreen).not.toHaveBeenCalled();
  });

  it("follows the document's fullscreenchange event", () => {
    setFullscreenEnabled(true);
    const container = document.createElement("div");
    const { result } = renderHook(() =>
      useFullscreen({ containerRef: { current: container } }),
    );
    expect(result.current.isFullscreen).toBe(false);

    // The document enters full screen, then announces it.
    act(() => {
      setFullscreenElement(container);
      document.dispatchEvent(new Event("fullscreenchange"));
    });

    expect(result.current.isFullscreen).toBe(true);
  });
});
