import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { waitForSoraLogin } from "./waitForSoraLogin";
import { useSoraLoginListener } from "./useSoraLoginListener";

const listenMock = vi.hoisted(() => vi.fn());
vi.mock("@tauri-apps/api/event", () => ({ listen: listenMock }));

describe("waitForSoraLogin", () => {
  it("unsubscribes even when the event fires before listen() resolves", async () => {
    const stop = vi.fn();
    let resolveListen: (fn: () => void) => void = () => {};
    let handler: () => void = () => {};
    listenMock.mockImplementation((_name: string, cb: () => void) => {
      handler = cb;
      return new Promise<() => void>((r) => {
        resolveListen = r;
      });
    });
    const pending = waitForSoraLogin();
    handler(); // event arrives before the unlisten fn is available
    await pending;
    expect(stop).not.toHaveBeenCalled();
    resolveListen(stop);
    await Promise.resolve();
    await Promise.resolve();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it("unsubscribes after the event when unlisten was already available", async () => {
    const stop = vi.fn();
    let handler: () => void = () => {};
    listenMock.mockImplementation((_name: string, cb: () => void) => {
      handler = cb;
      return Promise.resolve(stop);
    });
    const pending = waitForSoraLogin();
    await Promise.resolve();
    handler();
    await pending;
    expect(stop).toHaveBeenCalledTimes(1);
  });
});

describe("useSoraLoginListener", () => {
  it("removes a listener that registers after the component already unmounted", async () => {
    const stop = vi.fn();
    let resolveListen: (fn: () => void) => void = () => {};
    listenMock.mockImplementation(
      () =>
        new Promise<() => void>((r) => {
          resolveListen = r;
        }),
    );
    const { unmount } = renderHook(() => useSoraLoginListener(() => undefined));
    unmount();
    resolveListen(stop);
    await Promise.resolve();
    await Promise.resolve();
    expect(stop).toHaveBeenCalledTimes(1);
  });
});
