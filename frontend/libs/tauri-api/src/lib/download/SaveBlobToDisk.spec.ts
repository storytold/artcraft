// SaveBlobToDisk.spec: checks how an in-memory export (a Blob) is written to disk.
// The Tauri plugins are replaced with small stand-ins, so only the path choice and byte hand-off are exercised.
import { beforeEach, describe, expect, it, vi } from "vitest";

// Shared handles the mock factories below can see (vi.mock calls are hoisted above normal variables).
const m = vi.hoisted(() => ({
  save: vi.fn(),
  writeFile: vi.fn(),
  downloadDir: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-dialog", () => ({ save: m.save, open: vi.fn() }));
vi.mock("@tauri-apps/plugin-fs", () => ({ writeFile: m.writeFile }));
vi.mock("@tauri-apps/api/path", () => ({ downloadDir: m.downloadDir }));
vi.mock("@tauri-apps/plugin-upload", () => ({ download: vi.fn() }));
vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));

import { sanitizeFilename, saveBlobToDisk } from "./SaveBlobToDisk";

// "Ask location before download" lives in localStorage; the tests flip it directly.
const ASK_KEY = "artcraft_ask_location_before_download";

// jsdom's Blob has no arrayBuffer() (real WebViews do), so give test blobs one that returns their bytes.
function makeBlob(bytes: number[]): Blob {
  const blob = new Blob([new Uint8Array(bytes)]);
  (blob as Blob & { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer = async () =>
    new Uint8Array(bytes).buffer;
  return blob;
}

describe("saveBlobToDisk", () => {
  beforeEach(() => {
    Object.values(m).forEach((fn) => fn.mockReset());
    window.localStorage.removeItem(ASK_KEY);
    m.downloadDir.mockResolvedValue("/Users/me/Downloads");
  });

  it("writes the blob's bytes into the Downloads folder when the ask setting is off", async () => {
    const blob = makeBlob([1, 2, 3]);

    const path = await saveBlobToDisk(blob, "My Project.mp4");

    expect(path).toBe("/Users/me/Downloads/My Project.mp4");
    expect(m.save).not.toHaveBeenCalled();
    const [writtenPath, bytes] = m.writeFile.mock.calls[0];
    expect(writtenPath).toBe("/Users/me/Downloads/My Project.mp4");
    expect(Array.from(bytes as Uint8Array)).toEqual([1, 2, 3]);
  });

  it("pre-fills the save dialog with the real file name and writes to the chosen path", async () => {
    window.localStorage.setItem(ASK_KEY, "true");
    m.save.mockResolvedValue("/Volumes/Work/cut.mp4");

    const path = await saveBlobToDisk(makeBlob([120]), "cut.mp4");

    // The suggested name must be the export's own name, not something derived from a blob: URL (".bin").
    expect(m.save).toHaveBeenCalledWith({ defaultPath: "cut.mp4" });
    expect(path).toBe("/Volumes/Work/cut.mp4");
    expect(m.writeFile.mock.calls[0][0]).toBe("/Volumes/Work/cut.mp4");
  });

  it("writes nothing and returns null when the user dismisses the dialog", async () => {
    window.localStorage.setItem(ASK_KEY, "true");
    m.save.mockResolvedValue(null);

    expect(await saveBlobToDisk(makeBlob([120]), "cut.mp4")).toBeNull();
    expect(m.writeFile).not.toHaveBeenCalled();
  });
});

describe("sanitizeFilename", () => {
  it("replaces path separators and characters the OS rejects", () => {
    expect(sanitizeFilename("a/b\\c:d*e?f.mp4")).toBe("a_b_c_d_e_f.mp4");
  });

  it("falls back to a default for an empty name", () => {
    expect(sanitizeFilename("   ")).toBe("export");
  });
});
