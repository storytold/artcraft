import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";

// Only the two image probes and the toast are faked. The REAL library store is used on purpose: the bug is in what the store writes to
// localStorage for an uploaded image, so a mocked store could not show it.
const m = vi.hoisted(() => ({
  measureImage: vi.fn(),
  measureVideo: vi.fn(),
}));

// Toast is not under test; a bare function keeps the hook's import happy.
vi.mock("react-hot-toast", () => ({ default: vi.fn() }));
// The probes would wait for a real image decode, which jsdom never does.
vi.mock("./measureMedia", () => ({
  measureImage: m.measureImage,
  measureVideo: m.measureVideo,
}));

import { useBoardLibraryStore } from "./BoardLibraryStore";
import { useBoardItemEntry } from "./useBoardItemEntry";

// The key zustand persists the library under (same constant as BoardLibraryStore.ts).
const STORAGE_KEY = "artcraft_moodboard_library";
// The blob URL the stubbed URL.createObjectURL hands out for the dropped file.
const BLOB_URL = "blob:fake-upload-1";
// The long-lived address the media service serves the uploaded file from.
const CDN_URL = "https://cdn.example.test/uploads/a.png";

// Restores the real URL helpers after each test.
const realCreate = URL.createObjectURL;
const realRevoke = URL.revokeObjectURL;
let revokeSpy: ReturnType<typeof vi.fn>;

// Fresh library per test: empty boards, no selection, and nothing left over in localStorage.
const resetLibrary = () => {
  localStorage.clear();
  useBoardLibraryStore.setState({
    boards: {},
    boardOrder: [],
    activeBoardId: null,
    selectedItemIds: new Set(),
  });
};

// Runs the file-add flow and then lets the background upload (and any follow-up lookup) finish.
const addFile = async (adapter: unknown) => {
  const hook = renderHook(() => useBoardItemEntry(adapter as never, false));
  const file = new File(["x"], "a.png", { type: "image/png" });
  await act(async () => {
    await hook.result.current.addImageFile(file);
  });
  // The upload runs after addImageFile returns; give its promise chain several turns to settle.
  await act(async () => {
    for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
  });
};

// Returns the single item on the active board (the test only ever adds one).
const onlyItem = () => {
  const state = useBoardLibraryStore.getState();
  const board = state.boards[state.activeBoardId as string];
  return Object.values(board.items)[0] as unknown as {
    id: string;
    src: string;
    mediaId: string | null;
  };
};

// What a restart would find: the persisted library parsed back out of localStorage.
const persistedItems = (): Array<{ src: string; mediaId: string | null }> => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const boards = JSON.parse(raw).state.boards as Record<
    string,
    { items: Record<string, { src: string; mediaId: string | null }> }
  >;
  return Object.values(boards).flatMap((b) => Object.values(b.items));
};

beforeEach(() => {
  resetLibrary();
  m.measureImage.mockReset();
  m.measureImage.mockResolvedValue({ w: 100, h: 50 });
  // jsdom has no object URLs; hand out a fixed one and record revokes.
  revokeSpy = vi.fn();
  URL.createObjectURL = vi.fn(() => BLOB_URL) as never;
  URL.revokeObjectURL = revokeSpy as never;
});

afterEach(() => {
  cleanup();
  URL.createObjectURL = realCreate;
  URL.revokeObjectURL = realRevoke;
  vi.restoreAllMocks();
});

describe("an uploaded moodboard image keeps a durable address", () => {
  it("swaps the blob URL for the address the media service returns", async () => {
    const adapter = {
      uploadImage: vi.fn().mockResolvedValue("tok1"),
      resolveMediaUrl: vi.fn().mockResolvedValue(CDN_URL),
    };
    await addFile(adapter);
    // The token is kept, and the tile now points at the long-lived address instead of the page-bound blob.
    expect(adapter.resolveMediaUrl).toHaveBeenCalledWith("tok1");
    expect(onlyItem().mediaId).toBe("tok1");
    expect(onlyItem().src).toBe(CDN_URL);
  });

  it("is still in the saved library after a restart", async () => {
    const adapter = {
      uploadImage: vi.fn().mockResolvedValue("tok1"),
      resolveMediaUrl: vi.fn().mockResolvedValue(CDN_URL),
    };
    await addFile(adapter);
    // Before the fix the saved copy dropped every blob-backed item, so a restart found an empty board.
    const saved = persistedItems();
    expect(saved).toHaveLength(1);
    expect(saved[0].src).toBe(CDN_URL);
    expect(saved[0].mediaId).toBe("tok1");
  });

  // ---- controls: behaviour that must not change ----

  it("control: the blob URL is not released, because a tile already sent to generation may still show it", async () => {
    const adapter = {
      uploadImage: vi.fn().mockResolvedValue("tok1"),
      resolveMediaUrl: vi.fn().mockResolvedValue(CDN_URL),
    };
    await addFile(adapter);
    // "Send to generation" copies the tile's src into the prompt store; revoking the blob would break that thumbnail.
    expect(revokeSpy).not.toHaveBeenCalled();
  });

  it("control: a host with no lookup keeps the blob and the token as before", async () => {
    const adapter = { uploadImage: vi.fn().mockResolvedValue("tok1") };
    await addFile(adapter);
    expect(onlyItem().mediaId).toBe("tok1");
    expect(onlyItem().src).toBe(BLOB_URL);
    expect(revokeSpy).not.toHaveBeenCalled();
  });

  it("control: a lookup that finds nothing keeps the blob and the token", async () => {
    const adapter = {
      uploadImage: vi.fn().mockResolvedValue("tok1"),
      resolveMediaUrl: vi.fn().mockResolvedValue(null),
    };
    await addFile(adapter);
    expect(onlyItem().mediaId).toBe("tok1");
    expect(onlyItem().src).toBe(BLOB_URL);
    expect(revokeSpy).not.toHaveBeenCalled();
  });

  it("control: a lookup that throws keeps the blob and the token", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const adapter = {
      uploadImage: vi.fn().mockResolvedValue("tok1"),
      resolveMediaUrl: vi.fn().mockRejectedValue(new Error("offline")),
    };
    await addFile(adapter);
    expect(onlyItem().mediaId).toBe("tok1");
    expect(onlyItem().src).toBe(BLOB_URL);
    errSpy.mockRestore();
  });

  it("control: a failed upload never asks for an address", async () => {
    const adapter = {
      uploadImage: vi.fn().mockResolvedValue(null),
      resolveMediaUrl: vi.fn().mockResolvedValue(CDN_URL),
    };
    await addFile(adapter);
    expect(adapter.resolveMediaUrl).not.toHaveBeenCalled();
    expect(onlyItem().mediaId).toBeNull();
    expect(onlyItem().src).toBe(BLOB_URL);
  });

  it("control: a tile deleted while the lookup runs is not brought back", async () => {
    // Hold the lookup open so the test can delete the tile in the gap.
    let finishLookup: (url: string) => void = () => undefined;
    const adapter = {
      uploadImage: vi.fn().mockResolvedValue("tok1"),
      resolveMediaUrl: vi.fn(
        () => new Promise<string>((resolve) => (finishLookup = resolve)),
      ),
    };
    const hook = renderHook(() => useBoardItemEntry(adapter as never, false));
    await act(async () => {
      await hook.result.current.addImageFile(
        new File(["x"], "a.png", { type: "image/png" }),
      );
    });
    await act(async () => {
      for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
    });
    // The lookup is now in flight; delete the tile, then let the lookup finish.
    const state = useBoardLibraryStore.getState();
    const boardId = state.activeBoardId as string;
    state.removeItems(boardId, [onlyItem().id]);
    await act(async () => {
      finishLookup(CDN_URL);
      await new Promise((r) => setTimeout(r, 0));
    });
    expect(Object.keys(useBoardLibraryStore.getState().boards[boardId].items)).toHaveLength(0);
  });
});
