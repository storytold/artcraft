import { cleanup, renderHook } from "@testing-library/react";
import { PerspectiveCamera } from "three";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { usePageSceneStore } from "../PageSceneStore";
import type { FreeCamControlState } from "../engine/cameraMath";
import { useFreeCam } from "./useFreeCam";

// The hook asks the keybinds package which physical keys mean "fly forward"
// etc. Replace it with a fixed table: W = forward, S = back. The function is
// created once (vi.hoisted) so its identity is stable - the hook re-attaches
// all its listeners whenever that identity changes.
const keybinds = vi.hoisted(() => {
  const slotBindings = () => ({
    "pagescene.camera.forward": [{ code: "KeyW" }],
    "pagescene.camera.back": [{ code: "KeyS" }],
  });
  return { slotBindings };
});
vi.mock("@storyteller/keybinds", () => ({
  useResolvedKeybinds: () => ({ slotBindings: keybinds.slotBindings }),
}));

// jsdom has no PointerEvent. A MouseEvent already carries button / clientX /
// clientY, so we only need to bolt `pointerId` onto it by hand.
function pointerEvent(
  type: string,
  init: { button?: number; clientX?: number; clientY?: number } = {},
): MouseEvent {
  const event = new MouseEvent(type, { bubbles: true, cancelable: true, ...init });
  Object.defineProperty(event, "pointerId", { value: 1 });
  return event;
}

function keyEvent(
  type: "keydown" | "keyup",
  code: string,
  init: KeyboardEventInit = {},
): KeyboardEvent {
  return new KeyboardEvent(type, { code, bubbles: true, cancelable: true, ...init });
}

// Mount the hook against a real canvas element and a fake editor. Returns the
// camera (so tests can see if it moved) and the live control state object that
// the hook hands to the editor (so tests can see which keys count as held).
function mountFreeCam() {
  const canvas = document.createElement("canvas");
  // jsdom does not implement pointer capture; the hook calls these.
  canvas.setPointerCapture = vi.fn();
  canvas.releasePointerCapture = vi.fn();
  document.body.appendChild(canvas);

  const camera = new PerspectiveCamera();
  const setFreeCamState = vi.fn();
  const editor = {
    cameraController: { setFreeCamState, locked: false, camera },
  };

  renderHook(() => useFreeCam(canvas, editor as never));

  // The first effect calls setFreeCamState(state); grab that object.
  const state = setFreeCamState.mock.calls[0][0] as FreeCamControlState;
  return { canvas, camera, state };
}

beforeEach(() => {
  usePageSceneStore.setState({
    modalTransformActive: false,
    isPromptBoxFocused: false,
    timelineExpanded: false,
  });
});

afterEach(() => {
  // Unmount the hook (removes its listeners) and put the shared store back.
  cleanup();
  document.body.innerHTML = "";
  usePageSceneStore.setState({
    modalTransformActive: false,
    isPromptBoxFocused: false,
    timelineExpanded: false,
  });
});

describe("useFreeCam right-drag pan", () => {
  it("stops panning when the pointer is cancelled instead of released", () => {
    const { canvas, camera } = mountFreeCam();

    // Arrange: start a right-button drag, then drag 10px - the camera pans.
    canvas.dispatchEvent(pointerEvent("pointerdown", { button: 2, clientX: 0, clientY: 0 }));
    canvas.dispatchEvent(pointerEvent("pointermove", { clientX: 10, clientY: 10 }));
    const pannedTo = camera.position.clone();
    expect(pannedTo.length()).toBeGreaterThan(0);

    // Act: the browser cancels the pointer (e.g. a touch/pen gesture is taken
    // over by the system). It sends pointercancel and NEVER pointerup.
    canvas.dispatchEvent(pointerEvent("pointercancel"));
    // The mouse then just hovers over the canvas with no button held.
    canvas.dispatchEvent(pointerEvent("pointermove", { clientX: 50, clientY: 50 }));

    // Assert: the drag is over, so hovering must not move the camera.
    expect(camera.position.equals(pannedTo)).toBe(true);
  });
});

describe("useFreeCam key release", () => {
  it("clears a held movement key even if a modal transform started meanwhile", () => {
    const { state } = mountFreeCam();

    // Arrange: hold W - the camera should be flying forward.
    document.dispatchEvent(keyEvent("keydown", "KeyW"));
    expect(state.moveKeys.forward).toBe(1);

    // Act: while W is still down the user starts a modal grab (G), which turns
    // the modal-transform flag on, and THEN lets go of W.
    usePageSceneStore.setState({ modalTransformActive: true });
    document.dispatchEvent(keyEvent("keyup", "KeyW"));

    // Assert: the release was honoured. Before the fix keyup bailed out early
    // and forward stayed 1, so the camera kept drifting forever.
    expect(state.moveKeys.forward).toBe(0);
  });

  it("clears a held movement key when the prompt box got focus before release", () => {
    const { state } = mountFreeCam();

    // Arrange: hold S, then focus moves into the prompt box.
    document.dispatchEvent(keyEvent("keydown", "KeyS"));
    expect(state.moveKeys.back).toBe(1);
    usePageSceneStore.setState({ isPromptBoxFocused: true });

    // Act: release S while the prompt box owns the keyboard.
    document.dispatchEvent(keyEvent("keyup", "KeyS"));

    // Assert: the camera key is released.
    expect(state.moveKeys.back).toBe(0);
  });

  it("clears a held movement key when Ctrl is down at release time", () => {
    const { state } = mountFreeCam();

    // Arrange: hold W.
    document.dispatchEvent(keyEvent("keydown", "KeyW"));
    expect(state.moveKeys.forward).toBe(1);

    // Act: press Ctrl, then release W - the keyup event reports ctrlKey=true.
    document.dispatchEvent(keyEvent("keyup", "KeyW", { ctrlKey: true }));

    // Assert: W is released anyway (Ctrl chords only matter on keydown).
    expect(state.moveKeys.forward).toBe(0);
  });
});
