import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const listeners = new Map<string, () => void>();
const invoke = vi.fn(async () => ({ payload: { images: [] } }));

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

it("lists again when the window regains focus (the other desktop app may have added images)", async () => {
  renderHook(() => useLocalGenerations());
  await act(() => Promise.resolve());
  invoke.mockClear();
  await act(async () => {
    window.dispatchEvent(new Event("focus"));
  });
  expect(invoke).toHaveBeenCalledWith("list_local_generations_command");
});
