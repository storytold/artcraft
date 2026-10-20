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

  // A lookup that FAILED (offline, 5xx) is not the same as a lookup that found no prompt. The API client turns
  // network errors into `{ success: false }` (it never throws), so that is the failure the app really sees.
  describe("when the lookup fails", () => {
    it("stops the loading state but looks the token up again on the next mount (success: false)", async () => {
      m.list.mockResolvedValueOnce({ success: false, errorMessage: "offline" });
      const first = renderHook(() => useMediaPromptTokens(["f1"]));
      await waitFor(() => expect(first.result.current.has("f1")).toBe(true)); // no skeleton forever
      expect(first.result.current.get("f1")).toBe("");
      first.unmount();

      // Network is back: the same token must be looked up again and its prompt must show up.
      m.list.mockResolvedValue({ success: true, data: [{ token: "f1", maybe_prompt_token: "pf1" }] });
      const second = renderHook(() => useMediaPromptTokens(["f1"]));
      await waitFor(() => expect(second.result.current.get("f1")).toBe("pf1"));
      expect(m.list).toHaveBeenCalledTimes(2);
    });

    it("looks the token up again on the next mount after a thrown error", async () => {
      m.list.mockRejectedValueOnce(new Error("network"));
      const first = renderHook(() => useMediaPromptTokens(["f2"]));
      await waitFor(() => expect(first.result.current.get("f2")).toBe(""));
      first.unmount();

      m.list.mockResolvedValue({ success: true, data: [{ token: "f2", maybe_prompt_token: "pf2" }] });
      const second = renderHook(() => useMediaPromptTokens(["f2"]));
      await waitFor(() => expect(second.result.current.get("f2")).toBe("pf2"));
    });

    it("keeps the prompts from the chunks that worked when another chunk fails", async () => {
      const tokens = Array.from({ length: 60 }, (_, i) => `ch${String(i).padStart(2, "0")}`);
      // Tokens are sorted into the request, so the first chunk is ch00..ch49 and the second is ch50..ch59.
      m.list
        .mockResolvedValueOnce({ success: false, errorMessage: "offline" })
        .mockResolvedValueOnce({
          success: true,
          data: [{ token: "ch55", maybe_prompt_token: "p55" }],
        });
      const first = renderHook(() => useMediaPromptTokens(tokens));
      await waitFor(() => expect(first.result.current.get("ch55")).toBe("p55"));
      first.unmount();

      // Next mount: only the 50 tokens of the failed chunk are asked for again.
      m.list.mockResolvedValue({ success: true, data: [] });
      renderHook(() => useMediaPromptTokens(tokens));
      await waitFor(() => expect(m.list).toHaveBeenCalledTimes(3));
      expect(m.list.mock.calls[2][0].mediaTokens).toHaveLength(50);
      expect(m.list.mock.calls[2][0].mediaTokens).not.toContain("ch55");
    });

    it("does not look a token up again when the server answered that it has no prompt", async () => {
      m.list.mockResolvedValue({ success: true, data: [{ token: "f4", maybe_prompt_token: null }] });
      const first = renderHook(() => useMediaPromptTokens(["f4"]));
      await waitFor(() => expect(first.result.current.has("f4")).toBe(true));
      first.unmount();

      const second = renderHook(() => useMediaPromptTokens(["f4"]));
      expect(second.result.current.get("f4")).toBe("");
      expect(m.list).toHaveBeenCalledTimes(1);
    });
  });
});
