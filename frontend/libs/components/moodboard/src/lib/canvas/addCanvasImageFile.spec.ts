import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Only the image probe is faked (jsdom never decodes an image). The REAL canvas store and the REAL persistableCanvas are used on purpose:
// the bug is in what a restart would find for an uploaded image, which only those two together can show.
const m = vi.hoisted(() => ({ measureImage: vi.fn() }));

// The probe would wait for a real image decode, which jsdom never does.
vi.mock("../boards/measureMedia", () => ({ measureImage: m.measureImage }));

import { useMoodboardStore } from "./MoodboardStore";
import { addCanvasImageFromFile } from "./addCanvasImageFile";
import { persistableCanvas } from "../persistence/documents";
import { captureCanvasDocument } from "../persistence/canvasBridge";

// The blob URL the stubbed URL.createObjectURL hands out for the file.
const BLOB_URL = "blob:fake-canvas-1";
// The long-lived address the media service serves the uploaded file from.
const CDN_URL = "https://cdn.example.test/uploads/c.png";

// Restores the real URL helpers after each test.
const realCreate = URL.createObjectURL;
const realRevoke = URL.revokeObjectURL;

// Waits long enough for the background upload (and a follow-up lookup) to finish.
const settle = async () => {
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
};

// Places one file on the canvas through the shared helper and lets the background work finish; returns the new node's id.
const place = async (adapter: unknown): Promise<string> => {
  const id = await addCanvasImageFromFile({
    file: new File(["x"], "c.png", { type: "image/png" }),
    position: { x: 100, y: 100 },
    adapter: adapter as never,
  });
  await settle();
  return id;
};

// Reads a node back out of the live canvas store.
const node = (id: string) =>
  useMoodboardStore.getState().nodes[id] as unknown as {
    src: string;
    mediaId: string | null;
  };

beforeEach(() => {
  // Empty canvas and empty undo history for each test.
  useMoodboardStore.getState().reset();
  m.measureImage.mockReset();
  m.measureImage.mockResolvedValue({ w: 100, h: 50 });
  // jsdom has no object URLs.
  URL.createObjectURL = vi.fn(() => BLOB_URL) as never;
  URL.revokeObjectURL = vi.fn() as never;
});

afterEach(() => {
  URL.createObjectURL = realCreate;
  URL.revokeObjectURL = realRevoke;
  vi.restoreAllMocks();
});

describe("an image placed on the canvas keeps a durable address", () => {
  it("swaps the blob URL for the address the media service returns", async () => {
    const adapter = {
      uploadImage: vi.fn().mockResolvedValue("tok1"),
      resolveMediaUrl: vi.fn().mockResolvedValue(CDN_URL),
    };
    const id = await place(adapter);
    expect(adapter.resolveMediaUrl).toHaveBeenCalledWith("tok1");
    expect(node(id).mediaId).toBe("tok1");
    expect(node(id).src).toBe(CDN_URL);
  });

  it("is saved with its picture, not as an empty address, for the next start", async () => {
    const adapter = {
      uploadImage: vi.fn().mockResolvedValue("tok1"),
      resolveMediaUrl: vi.fn().mockResolvedValue(CDN_URL),
    };
    const id = await place(adapter);
    // What the local replica writes for this canvas. Before the fix a blob-backed node was saved with src "" (token only), and nothing in
    // the desktop app turns the token back into a picture, so the tile came back blank.
    const saved = persistableCanvas(captureCanvasDocument());
    expect((saved.nodes[id] as unknown as { src: string }).src).toBe(CDN_URL);
  });

  // ---- controls: behaviour that must not change ----

  it("control: the blob URL is not released, because undo snapshots still point at it", async () => {
    const adapter = {
      uploadImage: vi.fn().mockResolvedValue("tok1"),
      resolveMediaUrl: vi.fn().mockResolvedValue(CDN_URL),
    };
    await place(adapter);
    // Stepping back through history restores snapshots that reference the blob; revoking it would blank the image there.
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
  });

  it("control: a host with no lookup keeps the blob and the token as before", async () => {
    const id = await place({ uploadImage: vi.fn().mockResolvedValue("tok1") });
    expect(node(id).mediaId).toBe("tok1");
    expect(node(id).src).toBe(BLOB_URL);
  });

  it("control: a lookup that finds nothing keeps the blob and the token", async () => {
    const id = await place({
      uploadImage: vi.fn().mockResolvedValue("tok1"),
      resolveMediaUrl: vi.fn().mockResolvedValue(null),
    });
    expect(node(id).mediaId).toBe("tok1");
    expect(node(id).src).toBe(BLOB_URL);
  });

  it("control: a lookup that throws keeps the blob and the token", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const id = await place({
      uploadImage: vi.fn().mockResolvedValue("tok1"),
      resolveMediaUrl: vi.fn().mockRejectedValue(new Error("offline")),
    });
    expect(node(id).mediaId).toBe("tok1");
    expect(node(id).src).toBe(BLOB_URL);
    errSpy.mockRestore();
  });

  it("control: a failed upload never asks for an address", async () => {
    const adapter = {
      uploadImage: vi.fn().mockResolvedValue(null),
      resolveMediaUrl: vi.fn().mockResolvedValue(CDN_URL),
    };
    const id = await place(adapter);
    expect(adapter.resolveMediaUrl).not.toHaveBeenCalled();
    expect(node(id).mediaId).toBeNull();
  });

  it("control: a node deleted while the lookup runs is not brought back", async () => {
    // Hold the lookup open so the test can delete the node in the gap.
    let finishLookup: (url: string) => void = () => undefined;
    const adapter = {
      uploadImage: vi.fn().mockResolvedValue("tok1"),
      resolveMediaUrl: vi.fn(
        () => new Promise<string>((resolve) => (finishLookup = resolve)),
      ),
    };
    const id = await place(adapter);
    // The lookup is in flight; select and delete the node, then let the lookup finish.
    useMoodboardStore.getState().setSelection([id]);
    useMoodboardStore.getState().deleteSelected();
    finishLookup(CDN_URL);
    await settle();
    expect(useMoodboardStore.getState().nodes[id]).toBeUndefined();
  });
});
