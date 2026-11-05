import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";

const m = vi.hoisted(() => ({ listen: vi.fn(), unlisten: vi.fn() }));

vi.mock("@tauri-apps/api/event", () => ({ listen: m.listen }));

import { useCreditsBalanceChangedEvent } from "./CreditsBalanceChangedEvent";
import { useVideoGenerationCompleteEvent } from "./VideoGenerationCompleteEvent";
import { useFlashUserInputErrorEvent } from "../warning/FlashUserInputErrorEvent";

// The handler Tauri would call when the backend emits the event.
const emitted = () => m.listen.mock.calls[0][1] as (e: unknown) => Promise<void>;

beforeEach(() => {
  m.listen.mockReset();
  m.unlisten.mockReset();
  m.listen.mockResolvedValue(m.unlisten);
});
afterEach(() => cleanup());

describe.each([
  ["credits balance", useCreditsBalanceChangedEvent, "credits_balance_changed_event"],
  ["video generation", useVideoGenerationCompleteEvent, "video_generation_complete_event"],
  ["user input error", useFlashUserInputErrorEvent, "flash_user_input_error_event"],
] as const)("%s event hook", (_label, useHook, eventName) => {
  it("subscribes once to its event and passes the payload data to the callback", async () => {
    const cb = vi.fn(async () => undefined);
    renderHook(() => (useHook as (c: typeof cb) => void)(cb));
    expect(m.listen).toHaveBeenCalledTimes(1);
    expect(m.listen.mock.calls[0][0]).toBe(eventName);
    await emitted()({ payload: { data: { x: 1 } } });
    expect(cb).toHaveBeenCalledWith({ x: 1 });
  });

  it("calls the LATEST callback after a re-render (it used to call the first one forever)", async () => {
    const first = vi.fn(async () => undefined);
    const second = vi.fn(async () => undefined);
    const { rerender } = renderHook(({ cb }) => (useHook as (c: typeof first) => void)(cb), {
      initialProps: { cb: first },
    });
    rerender({ cb: second });
    expect(m.listen).toHaveBeenCalledTimes(1); // still a single subscription
    await emitted()({ payload: { data: {} } });
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });

  it("unsubscribes on unmount", async () => {
    const { unmount } = renderHook(() => (useHook as (c: () => Promise<void>) => void)(async () => undefined));
    unmount();
    await Promise.resolve();
    await Promise.resolve();
    expect(m.unlisten).toHaveBeenCalledTimes(1);
  });
});
