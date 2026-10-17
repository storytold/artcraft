import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const m = vi.hoisted(() => ({ list: vi.fn() }));

vi.mock("@storyteller/api", () => ({
  MediaFilesApi: class {
    ListMediaFilesByTokens = m.list;
  },
}));

import { useMediaPromptTokens } from "./media-prompt-token-cache";

// The cache is module-level and survives between tests, so every test uses
// its own tokens.
beforeEach(() => {
  m.list.mockReset();
});

describe("useMediaPromptTokens", () => {
  it("resolves media tokens to prompt tokens", async () => {
    m.list.mockResolvedValue({
      success: true,
      data: [{ token: "m1", maybe_prompt_token: "p1" }],
    });
    const { result } = renderHook(() => useMediaPromptTokens(["m1"]));
    expect(result.current.has("m1")).toBe(false); // still loading
    await waitFor(() => expect(result.current.get("m1")).toBe("p1"));
    expect(m.list).toHaveBeenCalledWith({ mediaTokens: ["m1"] });
  });

  it("records media without a prompt as an empty string (resolved, not loading)", async () => {
    m.list.mockResolvedValue({
      success: true,
      data: [{ token: "m2", maybe_prompt_token: null }],
    });
    const { result } = renderHook(() => useMediaPromptTokens(["m2"]));
    await waitFor(() => expect(result.current.has("m2")).toBe(true));
    expect(result.current.get("m2")).toBe("");
  });

  it("marks tokens the server did not return as resolved with no prompt", async () => {
    m.list.mockResolvedValue({ success: true, data: [] });
    const { result } = renderHook(() => useMediaPromptTokens(["m3"]));
    await waitFor(() => expect(result.current.get("m3")).toBe(""));
  });

  it("clears the loading state when the request throws", async () => {
    m.list.mockRejectedValue(new Error("network"));
    const { result } = renderHook(() => useMediaPromptTokens(["m4"]));
    await waitFor(() => expect(result.current.get("m4")).toBe(""));
  });

  it("does not fetch again for a token that is already cached", async () => {
    m.list.mockResolvedValue({ success: true, data: [{ token: "m5", maybe_prompt_token: "p5" }] });
    const first = renderHook(() => useMediaPromptTokens(["m5"]));
    await waitFor(() => expect(first.result.current.get("m5")).toBe("p5"));
    first.unmount();

    const second = renderHook(() => useMediaPromptTokens(["m5"]));
    expect(second.result.current.get("m5")).toBe("p5"); // served synchronously
    expect(m.list).toHaveBeenCalledTimes(1);
  });

  it("ignores empty tokens and de-duplicates the rest", async () => {
    m.list.mockResolvedValue({ success: true, data: [{ token: "m6", maybe_prompt_token: "p6" }] });
    const { result } = renderHook(() => useMediaPromptTokens(["m6", "m6", "", null, undefined]));
    await waitFor(() => expect(result.current.get("m6")).toBe("p6"));
    expect(m.list).toHaveBeenCalledTimes(1);
    expect(m.list).toHaveBeenCalledWith({ mediaTokens: ["m6"] });
  });

  it("splits large lists into requests of at most 50 tokens", async () => {
    m.list.mockResolvedValue({ success: true, data: [] });
    const tokens = Array.from({ length: 120 }, (_, i) => `big${i}`);
    renderHook(() => useMediaPromptTokens(tokens));
    await waitFor(() => expect(m.list).toHaveBeenCalledTimes(3));
    const sizes = m.list.mock.calls.map((c) => c[0].mediaTokens.length).sort((a, b) => b - a);
    expect(sizes).toEqual([50, 50, 20]);
  });
});
