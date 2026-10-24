import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, renderHook } from "@testing-library/react";
import type Konva from "konva";
import { useViewportControls } from "./useViewportControls";
import { useMoodboardStore } from "../MoodboardStore";

// The hook only calls `stage.container()`, so a div stands in for the Konva
// stage. `child` plays the part of Konva's content layer: a mousedown that
// reaches it is one the hook did NOT claim as a pan.
const setup = () => {
  const container = document.createElement("div");
  const child = document.createElement("div");
  container.appendChild(child);
  document.body.appendChild(container);
  const reachedKonva = vi.fn();
  child.addEventListener("mousedown", reachedKonva);
  const stageRef = {
    current: { container: () => container },
  } as unknown as React.RefObject<Konva.Stage>;
  const hook = renderHook(() => useViewportControls(stageRef));
  return { container, child, reachedKonva, ...hook };
};

const isPanning = () => useMoodboardStore.getState().transient.isPanning;
const pan = () => useMoodboardStore.getState().viewport.pan;

const pressSpace = () => fireEvent.keyDown(document, { code: "Space" });
const releaseSpace = () => fireEvent.keyUp(document, { code: "Space" });
// The OS moved focus elsewhere (Cmd+Tab, Cmd+Space/Spotlight, a dialog…).
const windowLosesFocus = () => fireEvent.blur(window);

describe("useViewportControls space-to-pan", () => {
  beforeEach(() => {
    useMoodboardStore.getState().setIsPanning(false);
    useMoodboardStore.getState().setPan({ x: 0, y: 0 });
  });
  afterEach(() => {
    // Releases anything a test left armed, then removes the hook's listeners.
    fireEvent.mouseUp(window);
    releaseSpace();
    cleanup();
    document.body.innerHTML = "";
  });

  it("pans on space + left-drag and does not hand the press to Konva", () => {
    const { child, reachedKonva, container } = setup();
    pressSpace();
    expect(container.style.cursor).toBe("grab");
    fireEvent.mouseDown(child, { button: 0, clientX: 10, clientY: 10 });
    expect(isPanning()).toBe(true);
    fireEvent.mouseMove(window, { clientX: 60, clientY: 40 });
    expect(pan()).toEqual({ x: 50, y: 30 });
    fireEvent.mouseUp(window);
    expect(isPanning()).toBe(false);
    expect(reachedKonva).not.toHaveBeenCalled();
  });

  it("stops treating clicks as pans once Space is released", () => {
    const { child, reachedKonva, container } = setup();
    pressSpace();
    releaseSpace();
    expect(container.style.cursor).toBe("");
    fireEvent.mouseDown(child, { button: 0, clientX: 10, clientY: 10 });
    expect(isPanning()).toBe(false);
    expect(reachedKonva).toHaveBeenCalledTimes(1);
  });

  it("forgets a held Space when the window loses focus (keyup never arrives)", () => {
    const { child, reachedKonva, container } = setup();
    pressSpace();
    // e.g. Cmd+Space opens Spotlight: the Space keyup goes to Spotlight.
    windowLosesFocus();
    expect(container.style.cursor).toBe("");
    // Back in the app, a plain click must select, not pan.
    fireEvent.mouseDown(child, { button: 0, clientX: 10, clientY: 10 });
    expect(isPanning()).toBe(false);
    expect(reachedKonva).toHaveBeenCalledTimes(1);
  });

  it("ends a pan in progress when the window loses focus (mouseup never arrives)", () => {
    const { child, container } = setup();
    pressSpace();
    fireEvent.mouseDown(child, { button: 0, clientX: 10, clientY: 10 });
    expect(isPanning()).toBe(true);
    // Cmd+Tab mid-drag: the button is released in another app.
    windowLosesFocus();
    expect(isPanning()).toBe(false);
    expect(container.style.cursor).toBe("");
    // Moving the mouse afterwards must not keep dragging the canvas.
    fireEvent.mouseMove(window, { clientX: 200, clientY: 200 });
    expect(pan()).toEqual({ x: 0, y: 0 });
  });

  it("leaves everything alone when the window loses focus with nothing in progress", () => {
    const { container } = setup();
    container.style.cursor = "crosshair";
    windowLosesFocus();
    expect(container.style.cursor).toBe("crosshair");
    expect(isPanning()).toBe(false);
  });
});
