import { beforeEach, describe, expect, it, vi } from "vitest";
import { effect } from "@preact/signals-core";

// jsdom has no ImageBitmap, so the tests use stand-in objects.
const bitmap = (label: string) => ({ label, width: 1, height: 1 }) as unknown as ImageBitmap;

// The bitmap lives in a module-level signal; load a fresh module per test so
// one test's bitmap can never leak into the next.
const load = async () => {
  vi.resetModules();
  return await import("./canvasRenderBitmap");
};

beforeEach(() => {
  vi.resetModules();
});

describe("canvas render bitmap signal", () => {
  it("has no bitmap until one is set", async () => {
    const { getCanvasRenderBitmap } = await load();
    expect(getCanvasRenderBitmap()).toBeUndefined();
  });

  it("returns the exact bitmap that was set", async () => {
    const { getCanvasRenderBitmap, setCanvasRenderBitmap } = await load();
    const first = bitmap("first");
    setCanvasRenderBitmap(first);
    expect(getCanvasRenderBitmap()).toBe(first);
  });

  it("replaces the previous bitmap on a second set", async () => {
    const { getCanvasRenderBitmap, setCanvasRenderBitmap } = await load();
    setCanvasRenderBitmap(bitmap("first"));
    const second = bitmap("second");
    setCanvasRenderBitmap(second);
    expect(getCanvasRenderBitmap()).toBe(second);
  });

  it("is reactive: a subscriber re-runs with each new bitmap", async () => {
    const { getCanvasRenderBitmap, setCanvasRenderBitmap } = await load();
    const seen: Array<ImageBitmap | undefined> = [];
    const stop = effect(() => {
      seen.push(getCanvasRenderBitmap());
    });
    const a = bitmap("a");
    const b = bitmap("b");
    setCanvasRenderBitmap(a);
    setCanvasRenderBitmap(b);
    stop();
    setCanvasRenderBitmap(bitmap("after stop"));
    expect(seen).toEqual([undefined, a, b]);
  });

  it("does not wake subscribers when the same bitmap is set again", async () => {
    const { getCanvasRenderBitmap, setCanvasRenderBitmap } = await load();
    const a = bitmap("a");
    setCanvasRenderBitmap(a);
    let runs = 0;
    const stop = effect(() => {
      void getCanvasRenderBitmap();
      runs += 1;
    });
    setCanvasRenderBitmap(a);
    stop();
    expect(runs).toBe(1);
  });
});
