import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCanvasBgRemovedEvent } from "./CanvasBgRemovedEvent";
import { BasicEventStatus } from "./BasicEventWrapper";

const listenMock = vi.hoisted(() => vi.fn());
vi.mock("@tauri-apps/api/event", () => ({ listen: listenMock }));

describe("useCanvasBgRemovedEvent", () => {
  it("calls the latest callback, not the one from the first render", async () => {
    const stop = vi.fn();
    let handler: (e: unknown) => Promise<void> = async () => {};
    listenMock.mockImplementation((_n: string, cb: (e: unknown) => Promise<void>) => {
      handler = cb;
      return Promise.resolve(stop);
    });
    const first = vi.fn(async () => {});
    const second = vi.fn(async () => {});
    const { rerender, unmount } = renderHook(({ cb }) => useCanvasBgRemovedEvent(cb), {
      initialProps: { cb: first },
    });
    rerender({ cb: second });
    const data = { media_token: "mf_1", image_cdn_url: "u" };
    await handler({ payload: { status: BasicEventStatus.Success, data } });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith(data);
    expect(listenMock).toHaveBeenCalledTimes(1);
    unmount();
    await Promise.resolve();
    expect(stop).toHaveBeenCalledTimes(1);
  });
});
