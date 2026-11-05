import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useTauriWindowControls } from "./useWindowControls";

const listenMock = vi.hoisted(() => vi.fn());
vi.mock("@tauri-apps/api/event", () => ({ listen: listenMock }));
vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({ isMaximized: async () => false }),
}));

afterEach(() => {
  delete (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;
  listenMock.mockReset();
});

const flush = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
};

describe("useTauriWindowControls", () => {
  it("unsubscribes every listener that registers after the component unmounted", async () => {
    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
    const stops: ReturnType<typeof vi.fn>[] = [];
    const resolvers: Array<() => void> = [];
    listenMock.mockImplementation(() => {
      const stop = vi.fn();
      stops.push(stop);
      return new Promise((resolve) => resolvers.push(() => resolve(stop)));
    });
    const { unmount } = renderHook(() => useTauriWindowControls());
    await flush();
    expect(resolvers.length).toBe(1); // first listen() is pending
    unmount(); // cleanup runs while setup is still awaiting
    resolvers[0]();
    await flush();
    // Nothing further may be subscribed after cancellation, and the one that
    // did register must have been removed.
    expect(listenMock).toHaveBeenCalledTimes(1);
    expect(stops[0]).toHaveBeenCalledTimes(1);
  });

  it("removes all three listeners on a normal unmount", async () => {
    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__ = {};
    const stops: ReturnType<typeof vi.fn>[] = [];
    listenMock.mockImplementation(async () => {
      const stop = vi.fn();
      stops.push(stop);
      return stop;
    });
    const { unmount } = renderHook(() => useTauriWindowControls());
    await flush();
    unmount();
    expect(stops).toHaveLength(3);
    stops.forEach((s) => expect(s).toHaveBeenCalledTimes(1));
  });
});
