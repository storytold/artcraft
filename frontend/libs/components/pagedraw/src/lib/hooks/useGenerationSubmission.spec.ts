import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import toast from "react-hot-toast";
import { useGenerationSubmission } from "./useGenerationSubmission";

vi.mock("react-hot-toast", () => ({ default: { error: vi.fn() } }));

afterEach(() => vi.restoreAllMocks());

describe("canvas generation submission", () => {
  it.each([
    [{ error_message: "Provider rejected the mask" }, "Provider rejected the mask"],
    [new Error("Mask encoding failed"), "Mask encoding failed"],
    ["Upload failed", "Upload failed"],
    [{ status: "server_error" }, "Failed to start image generation. Please try again."],
    [{ error_message: { unexpected: true } }, "Failed to start image generation. Please try again."],
  ])("shows failures and releases the generate button", async (error, expected) => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { result } = renderHook(() => useGenerationSubmission());
    const addPendingGeneration = vi.fn();
    await act(async () => {
      await result.current.runGeneration(async () => {
        await Promise.reject(error);
        addPendingGeneration();
      });
    });
    expect(toast.error).toHaveBeenCalledWith(expected);
    expect(addPendingGeneration).not.toHaveBeenCalled();
    expect(result.current.isGenerating).toBe(false);

    await act(async () => {
      await result.current.runGeneration(async () => { addPendingGeneration(); });
    });
    expect(addPendingGeneration).toHaveBeenCalledOnce();
  });

  it("prevents duplicate enqueues while a submission is pending", async () => {
    const { result } = renderHook(() => useGenerationSubmission());
    let resolve!: () => void;
    const pending = new Promise<void>((done) => { resolve = done; });
    const enqueue = vi.fn(() => pending);
    let first!: Promise<void>;
    act(() => { first = result.current.runGeneration(enqueue); });
    expect(result.current.isGenerating).toBe(true);
    await act(async () => { await result.current.runGeneration(enqueue); });
    expect(enqueue).toHaveBeenCalledOnce();
    await act(async () => { resolve(); await first; });
    expect(result.current.isGenerating).toBe(false);
  });
});
