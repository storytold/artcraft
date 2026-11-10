import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const listeners = new Map<string, () => void>();
const invoke = vi.fn(async (..._args: unknown[]) => ({ status: "success", payload: { images: [] } }));

vi.mock("@tauri-apps/api/core", () => ({ invoke: (...args: unknown[]) => invoke(...args) }));
vi.mock("@tauri-apps/api/event", () => ({
  listen: async (name: string, handler: () => void) => {
    listeners.set(name, handler);
    return () => listeners.delete(name);
  },
}));

const { useLocalGenerations } = await import("./LocalGenerations");

afterEach(() => {
  listeners.clear();
  invoke.mockClear();
});

it("lists again when any generation completes", async () => {
  renderHook(() => useLocalGenerations());
  await act(() => Promise.resolve());
  invoke.mockClear();
  await act(async () => listeners.get("generation-complete-event")?.());
  expect(invoke).toHaveBeenCalledWith("list_local_generations_command");
});

it("lists again when the window regains focus", async () => {
  renderHook(() => useLocalGenerations());
  await act(() => Promise.resolve());
  invoke.mockClear();
  await act(async () => {
    window.dispatchEvent(new Event("focus"));
  });
  expect(invoke).toHaveBeenCalledWith("list_local_generations_command");
});

it("shares one refresh and listener set between hook consumers", async () => {
  const first = renderHook(() => useLocalGenerations());
  const second = renderHook(() => useLocalGenerations());
  await act(() => Promise.resolve());
  expect(invoke).toHaveBeenCalledTimes(1);
  first.unmount();
  invoke.mockClear();
  await act(async () => listeners.get("generation-complete-event")?.());
  expect(invoke).toHaveBeenCalledTimes(1);
  second.unmount();
  await act(() => Promise.resolve());
  expect(listeners.size).toBe(0);
});
