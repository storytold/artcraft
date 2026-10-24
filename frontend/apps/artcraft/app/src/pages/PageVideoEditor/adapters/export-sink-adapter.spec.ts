// export-sink-adapter.spec: the video editor's "Save to disk" must hand the render's Blob to the
// Tauri file writer, not a blob: URL to the Rust HTTP downloader (which rejected it every time).
import { beforeEach, describe, expect, it, vi } from "vitest";

// Shared stand-ins (vi.mock factories are hoisted above normal variables).
const m = vi.hoisted(() => ({
  saveBlobToDisk: vi.fn(),
  uploadByKind: vi.fn(),
}));

vi.mock("@storyteller/tauri-api", () => ({ saveBlobToDisk: m.saveBlobToDisk }));
vi.mock("./upload-by-kind", () => ({ uploadByKind: m.uploadByKind }));
vi.mock("@storyteller/ui-video-editor", () => ({ kindFromMime: () => "video" }));

import { tauriExportSinkAdapter } from "./export-sink-adapter";

const artifact = {
  blob: new Blob(["bytes"]),
  filename: "cut.mp4",
  mime: "video/mp4",
} as never;

describe("tauriExportSinkAdapter save to disk", () => {
  beforeEach(() => {
    m.saveBlobToDisk.mockReset();
    m.uploadByKind.mockReset();
  });

  it("passes the blob and filename to saveBlobToDisk and returns the written path", async () => {
    m.saveBlobToDisk.mockResolvedValue("/Users/me/Downloads/cut.mp4");
    const onProgress = vi.fn();

    const path = await tauriExportSinkAdapter.accept(artifact, { saveToDisk: true, onProgress });

    expect(m.saveBlobToDisk).toHaveBeenCalledWith((artifact as { blob: Blob }).blob, "cut.mp4");
    expect(path).toBe("/Users/me/Downloads/cut.mp4");
    expect(onProgress).toHaveBeenLastCalledWith({ destination: "disk", status: "success" });
  });

  it("reports a cancelled dialog as an error and returns null", async () => {
    m.saveBlobToDisk.mockResolvedValue(null);
    const onProgress = vi.fn();

    const path = await tauriExportSinkAdapter.accept(artifact, { saveToDisk: true, onProgress });

    expect(path).toBeNull();
    expect(onProgress).toHaveBeenLastCalledWith({
      destination: "disk",
      status: "error",
      error: "Save dialog cancelled",
    });
  });

  it("surfaces a write failure message instead of throwing", async () => {
    m.saveBlobToDisk.mockRejectedValue(new Error("disk full"));
    const onProgress = vi.fn();

    const path = await tauriExportSinkAdapter.accept(artifact, { saveToDisk: true, onProgress });

    expect(path).toBeNull();
    expect(onProgress).toHaveBeenLastCalledWith({
      destination: "disk",
      status: "error",
      error: "disk full",
    });
  });
});
