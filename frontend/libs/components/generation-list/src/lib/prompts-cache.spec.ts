import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const m = vi.hoisted(() => ({ batch: vi.fn() }));

vi.mock("@storyteller/api", () => ({
  PromptsApi: class {
    BatchGetPrompts = m.batch;
  },
}));

import { getCachedPrompt, usePrompts } from "./prompts-cache";

// The cache is module-level and survives between tests, so every test uses
// its own tokens.
beforeEach(() => {
  m.batch.mockReset();
});

const prompt = (token: string) => ({ token, maybe_positive_prompt: `text ${token}` }) as never;

describe("usePrompts", () => {
  it("fetches missing prompts and returns them keyed by token", async () => {
    m.batch.mockResolvedValue({ success: true, data: [prompt("a1")] });
    const { result } = renderHook(() => usePrompts(["a1"]));
    expect(result.current.size).toBe(0);
    await waitFor(() => expect(result.current.has("a1")).toBe(true));
    expect(m.batch).toHaveBeenCalledWith({ tokens: ["a1"] });
    expect(getCachedPrompt("a1")).toBeDefined();
  });

  it("ignores empty tokens and de-duplicates", async () => {
    m.batch.mockResolvedValue({ success: true, data: [prompt("a2")] });
    const { result } = renderHook(() => usePrompts(["a2", "a2", "", null, undefined]));
    await waitFor(() => expect(result.current.has("a2")).toBe(true));
    expect(m.batch).toHaveBeenCalledTimes(1);
    expect(m.batch).toHaveBeenCalledWith({ tokens: ["a2"] });
  });

  it("does not call the API when given no tokens", () => {
    renderHook(() => usePrompts([null, ""]));
    expect(m.batch).not.toHaveBeenCalled();
  });

  it("does not refetch cached tokens", async () => {
    m.batch.mockResolvedValue({ success: true, data: [prompt("a3")] });
    const first = renderHook(() => usePrompts(["a3"]));
    await waitFor(() => expect(first.result.current.has("a3")).toBe(true));
    first.unmount();
    const second = renderHook(() => usePrompts(["a3"]));
    expect(second.result.current.has("a3")).toBe(true);
    expect(m.batch).toHaveBeenCalledTimes(1);
  });

  it("only asks for the tokens that are still missing", async () => {
    m.batch.mockResolvedValueOnce({ success: true, data: [prompt("a4")] });
    const first = renderHook(() => usePrompts(["a4"]));
    await waitFor(() => expect(first.result.current.has("a4")).toBe(true));

    m.batch.mockResolvedValueOnce({ success: true, data: [prompt("a5")] });
    const second = renderHook(() => usePrompts(["a4", "a5"]));
    await waitFor(() => expect(second.result.current.has("a5")).toBe(true));
    expect(m.batch).toHaveBeenLastCalledWith({ tokens: ["a5"] });
  });

  it("survives a failed request and retries when the token set changes back", async () => {
    m.batch.mockRejectedValueOnce(new Error("network"));
    const { result, rerender } = renderHook(({ t }) => usePrompts(t), {
      initialProps: { t: ["a6"] as string[] },
    });
    await waitFor(() => expect(m.batch).toHaveBeenCalledTimes(1));
    expect(result.current.size).toBe(0);

    m.batch.mockResolvedValue({ success: true, data: [prompt("a6")] });
    rerender({ t: ["a6", "a7"] });
    await waitFor(() => expect(result.current.has("a6")).toBe(true));
  });
});
