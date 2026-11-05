import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadBlob } from "./browser";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("downloadBlob", () => {
  it("keeps the blob URL alive after the click so the browser can start reading it", () => {
    vi.useFakeTimers();
    const create = vi.fn(() => "blob:snapshot");
    const revoke = vi.fn();
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    downloadBlob({ blob: new Blob(["x"]), filename: "snapshot.png" });

    // Right after the click the download has not read the blob yet.
    expect(revoke).not.toHaveBeenCalled();

    // The URL is still released later so the blob does not leak.
    vi.advanceTimersByTime(60_000);
    expect(revoke).toHaveBeenCalledWith("blob:snapshot");
  });
});
