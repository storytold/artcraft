import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StrictMode } from "react";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useCheatsheetPin, useCheatsheetVisibility } from "./useCheatsheetVisibility";
import { useKeybindsStore } from "../keybinds-store";

const press = (type: "keydown" | "keyup", key: string) =>
  act(() => {
    document.dispatchEvent(new KeyboardEvent(type, { key }));
  });

describe("useCheatsheetVisibility sticky hand-over", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Platform decides whether the modifier is Meta or Control.
    vi.spyOn(navigator, "platform", "get").mockReturnValue("Linux");
    useCheatsheetPin.setState({ pinned: false });
    useKeybindsStore.setState({ cheatsheetSticky: true });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("pins on release after a long hold without updating a store during render", () => {
    // Updating the pin store from inside a setState updater runs during render
    // and makes React warn about cross-component updates.
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { result } = renderHook(() => useCheatsheetVisibility(), { wrapper: StrictMode });

    press("keydown", "Control");
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current).toBe(true);

    press("keyup", "Control");

    expect(useCheatsheetPin.getState().pinned).toBe(true);
    expect(result.current).toBe(true);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("does not pin when the modifier is released before the hold elapsed", () => {
    renderHook(() => useCheatsheetVisibility());
    press("keydown", "Control");
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    press("keyup", "Control");
    expect(useCheatsheetPin.getState().pinned).toBe(false);
  });

  it("hides without pinning when sticky is off", () => {
    useKeybindsStore.setState({ cheatsheetSticky: false });
    const { result } = renderHook(() => useCheatsheetVisibility());
    press("keydown", "Control");
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    press("keyup", "Control");
    expect(useCheatsheetPin.getState().pinned).toBe(false);
    expect(result.current).toBe(false);
  });
});
