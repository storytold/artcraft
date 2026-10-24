import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

const m = vi.hoisted(() => ({ list: vi.fn() }));

vi.mock("@storyteller/api", () => ({
  GalleryModalApi: class {
    listUserMediaFiles = m.list;
  },
  FilterMediaType: { SCENE_JSON: "scene_json" },
}));

// Thumbnail helpers are not under test here; return simple stand-ins.
vi.mock("@storyteller/common", () => ({
  getMediaThumbnail: () => "thumb",
  getMediaStillThumbnail: () => "still",
  THUMBNAIL_SIZES: { LARGE: 512 },
}));

import { useGalleryData } from "./useGalleryData";

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

const resp = (token: string, extra: Record<string, unknown> = {}) => ({
  success: true,
  data: [{ token, media_class: "image", created_at: "2026-01-01", ...extra }],
  pagination: { current: 0, total_page_count: 1 },
});

// Stable array so the hook's effect isn't re-run by a new reference.
const IMAGE = ["image"] as never;

beforeEach(() => {
  m.list.mockReset();
});

describe("useGalleryData", () => {
  it("loads items for a user", async () => {
    m.list.mockResolvedValue(resp("g1"));
    const { result } = renderHook(() =>
      useGalleryData({ username: "ann", filterMediaClasses: IMAGE }),
    );
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0].id).toBe("g1");
    expect(result.current.hasMore).toBe(false);
  });

  it("does nothing and stops the spinner when logged out", async () => {
    const { result } = renderHook(() =>
      useGalleryData({ username: null, filterMediaClasses: IMAGE }),
    );
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    expect(m.list).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("filters out scene json and, with excludeUploads, uploads", async () => {
    m.list.mockResolvedValue({
      success: true,
      data: [
        { token: "keep", media_class: "image" },
        { token: "scene", media_class: "image", media_type: "scene_json" },
        { token: "up", media_class: "image", origin_category: "upload" },
      ],
      pagination: { current: 0, total_page_count: 1 },
    });
    const { result } = renderHook(() =>
      useGalleryData({ username: "ann", filterMediaClasses: IMAGE, excludeUploads: true }),
    );
    await waitFor(() => expect(result.current.items.map((i) => i.id)).toEqual(["keep"]));
  });

  it("drops a response that arrives after the user changed", async () => {
    const slow = deferred<ReturnType<typeof resp>>();
    m.list.mockReturnValueOnce(slow.promise).mockResolvedValueOnce(resp("bob-item"));

    const { result, rerender } = renderHook(
      ({ u }: { u: string }) => useGalleryData({ username: u, filterMediaClasses: IMAGE }),
      { initialProps: { u: "ann" } },
    );
    rerender({ u: "bob" });
    await waitFor(() => expect(result.current.items.map((i) => i.id)).toEqual(["bob-item"]));

    await act(async () => {
      slow.resolve(resp("ann-late"));
    });
    expect(result.current.items.map((i) => i.id)).toEqual(["bob-item"]);
  });

  it("drops the response of a request superseded by refresh()", async () => {
    const first = deferred<ReturnType<typeof resp>>();
    m.list.mockReturnValueOnce(first.promise).mockResolvedValueOnce(resp("fresh"));

    const { result } = renderHook(() =>
      useGalleryData({ username: "ann", filterMediaClasses: IMAGE }),
    );
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.items.map((i) => i.id)).toEqual(["fresh"]));

    await act(async () => {
      first.resolve(resp("stale"));
    });
    expect(result.current.items.map((i) => i.id)).toEqual(["fresh"]);
  });

  // ---- failed loads (B-157): a failed request must be reported, not left looking like "still loading" ----

  it("reports loadFailed when the request rejects, keeps hasMore so a retry can ask again, and clears it after a good retry", async () => {
    // First request fails, the retry works.
    m.list.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(resp("g1"));
    const { result } = renderHook(() =>
      useGalleryData({ username: "ann", filterMediaClasses: IMAGE }),
    );
    await waitFor(() => expect(result.current.loadFailed).toBe(true));
    // The full-page spinner is over, nothing was loaded, and more can still be asked for.
    expect(result.current.isInitialLoading).toBe(false);
    expect(result.current.items).toEqual([]);
    expect(result.current.hasMore).toBe(true);
    // The retry is the same call the scroll sentinel makes.
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.items.map((i) => i.id)).toEqual(["g1"]));
    expect(result.current.loadFailed).toBe(false);
  });

  it("reports loadFailed when the API answers success:false instead of throwing", async () => {
    m.list.mockResolvedValue({ success: false, errorMessage: "network down" });
    const { result } = renderHook(() =>
      useGalleryData({ username: "ann", filterMediaClasses: IMAGE }),
    );
    await waitFor(() => expect(result.current.loadFailed).toBe(true));
    expect(result.current.items).toEqual([]);
  });

  it("does not report a failure for an empty but successful history", async () => {
    m.list.mockResolvedValue({
      success: true,
      data: [],
      pagination: { current: 0, total_page_count: 1 },
    });
    const { result } = renderHook(() =>
      useGalleryData({ username: "ann", filterMediaClasses: IMAGE }),
    );
    await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
    expect(result.current.loadFailed).toBe(false);
    expect(result.current.hasMore).toBe(false);
  });

  it("ignores a failure from a request that refresh() already superseded", async () => {
    const first = deferred<ReturnType<typeof resp>>();
    m.list.mockReturnValueOnce(first.promise).mockResolvedValueOnce(resp("fresh"));
    const { result } = renderHook(() =>
      useGalleryData({ username: "ann", filterMediaClasses: IMAGE }),
    );
    act(() => result.current.refresh());
    await waitFor(() => expect(result.current.items.map((i) => i.id)).toEqual(["fresh"]));
    // The old request now fails; the newer, good feed must not be marked as failed.
    await act(async () => {
      first.resolve({ success: false } as never);
    });
    expect(result.current.loadFailed).toBe(false);
    expect(result.current.items.map((i) => i.id)).toEqual(["fresh"]);
  });
});
