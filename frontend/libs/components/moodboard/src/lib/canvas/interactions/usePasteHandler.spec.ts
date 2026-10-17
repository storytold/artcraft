import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

const m = vi.hoisted(() => ({ addFromFile: vi.fn() }));
vi.mock("../addCanvasImageFile", () => ({ addCanvasImageFromFile: m.addFromFile }));

import { usePasteHandler, viewportCenterOnCanvas } from "./usePasteHandler";

const stage = (o: { w: number; h: number; x: number; y: number; s: number }) =>
  ({
    width: () => o.w,
    height: () => o.h,
    x: () => o.x,
    y: () => o.y,
    scaleX: () => o.s,
    scaleY: () => o.s,
  }) as never;

describe("viewportCenterOnCanvas", () => {
  it("falls back to a fixed point with no stage", () => {
    expect(viewportCenterOnCanvas(null)).toEqual({ x: 400, y: 400 });
  });

  it("is the plain half-size centre for an untouched view", () => {
    expect(viewportCenterOnCanvas(stage({ w: 800, h: 600, x: 0, y: 0, s: 1 }))).toEqual({
      x: 400,
      y: 300,
    });
  });

  it("accounts for panning and zoom", () => {
    // Panned 100px right / 50px down and zoomed 2x: screen centre (400,300)
    // is canvas point ((400-100)/2, (300-50)/2).
    expect(viewportCenterOnCanvas(stage({ w: 800, h: 600, x: 100, y: 50, s: 2 }))).toEqual({
      x: 150,
      y: 125,
    });
  });
});

describe("usePasteHandler", () => {
  afterEach(() => m.addFromFile.mockReset());

  const paste = (file: File) => {
    const event = new Event("paste", { cancelable: true }) as unknown as ClipboardEvent;
    Object.defineProperty(event, "clipboardData", {
      value: { items: [{ kind: "file", type: file.type, getAsFile: () => file }] },
    });
    window.dispatchEvent(event);
    return event;
  };

  it("drops a pasted image at the canvas-space viewport centre", async () => {
    const file = new File(["x"], "a.png", { type: "image/png" });
    const adapter = {} as never;
    renderHook(() =>
      usePasteHandler(adapter, true, {
        current: stage({ w: 800, h: 600, x: 100, y: 50, s: 2 }),
      }),
    );
    const event = paste(file);
    expect(event.defaultPrevented).toBe(true);
    expect(m.addFromFile).toHaveBeenCalledWith({
      file,
      position: { x: 150, y: 125 },
      adapter,
    });
  });

  it("ignores pastes while inactive", () => {
    renderHook(() => usePasteHandler({} as never, false, { current: null }));
    paste(new File(["x"], "a.png", { type: "image/png" }));
    expect(m.addFromFile).not.toHaveBeenCalled();
  });
});
