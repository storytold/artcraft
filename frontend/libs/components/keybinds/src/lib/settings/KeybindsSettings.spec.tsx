// KeybindsSettings.spec: checks the "press a key to rebind" behaviour of Settings -> Keybinds.
// Clicking a row's binding box arms it; the next key press becomes the action's new binding and is saved in the
// keybinds store as an override. These tests drive the real settings screen and read the store, so they show what
// a user actually ends up with after rebinding.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, fireEvent, render, within } from "@testing-library/react";
import { KeybindsSettings } from "./KeybindsSettings";
import { useKeybindsStore } from "../keybinds-store";

// Press a key the way the browser reports it: the capture listener sits on window (capture phase).
const press = (init: KeyboardEventInit) =>
  act(() => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init }),
    );
  });

// The binding box of the row whose label is `label` (each row is: dot, label, ..., binding box).
const bindingBox = (view: ReturnType<typeof render>, label: string) => {
  const row = view.getByText(label).parentElement as HTMLElement;
  return within(row).getByLabelText("Change keybinding");
};

describe("KeybindsSettings rebinding", () => {
  beforeEach(() => {
    useKeybindsStore.setState({ selectedPreset: "gamer", overrides: {} });
  });

  afterEach(() => {
    cleanup();
  });

  it("rebinds a held camera key to another plain key", () => {
    const view = render(<KeybindsSettings />);
    fireEvent.click(bindingBox(view, "Camera forward"));
    press({ code: "KeyJ" });
    expect(useKeybindsStore.getState().overrides["pagescene.camera.forward"]).toEqual([
      { code: "KeyJ", ctrl: false, shift: false, alt: false },
    ]);
  });

  // The viewport tracks camera keys by the bare key and ignores any press with Ctrl/Cmd held, so a camera
  // key saved with a modifier would show in Settings but never move the camera (and the old plain key is gone).
  it.each([
    ["Ctrl", { ctrlKey: true }],
    ["Shift", { shiftKey: true }],
    ["Alt", { altKey: true }],
  ])("refuses a %s chord for a held camera key", (_name, modifier) => {
    const view = render(<KeybindsSettings />);
    fireEvent.click(bindingBox(view, "Camera forward"));
    press({ code: "KeyJ", ...modifier });
    expect(useKeybindsStore.getState().overrides["pagescene.camera.forward"]).toBeUndefined();
    // The user is told why nothing changed.
    expect(view.getByRole("status").textContent).toMatch(/Camera forward/);
  });

  it("still lets a one-shot action use a Ctrl chord", () => {
    const view = render(<KeybindsSettings />);
    fireEvent.click(bindingBox(view, "Move (translate)"));
    press({ code: "KeyJ", ctrlKey: true });
    expect(useKeybindsStore.getState().overrides["pagescene.transform.translate"]).toEqual([
      { code: "KeyJ", ctrl: true, shift: false, alt: false },
    ]);
  });

  // Arming a row and then clicking somewhere else (for example the search box) used to leave the key trap on:
  // the next letter typed anywhere was swallowed and silently rebound the row.
  it("stops listening for a key once focus moves to another field", () => {
    const view = render(<KeybindsSettings />);
    fireEvent.click(bindingBox(view, "Camera forward"));
    act(() => {
      view.container.querySelector("input")!.focus();
    });
    press({ code: "KeyJ" });
    expect(useKeybindsStore.getState().overrides["pagescene.camera.forward"]).toBeUndefined();
  });

  it("listens for a key on one row at a time", () => {
    const view = render(<KeybindsSettings />);
    fireEvent.click(bindingBox(view, "Camera forward"));
    fireEvent.click(bindingBox(view, "Camera back"));
    press({ code: "KeyJ" });
    const { overrides } = useKeybindsStore.getState();
    expect(overrides["pagescene.camera.forward"]).toBeUndefined();
    expect(overrides["pagescene.camera.back"]).toEqual([
      { code: "KeyJ", ctrl: false, shift: false, alt: false },
    ]);
  });
});
