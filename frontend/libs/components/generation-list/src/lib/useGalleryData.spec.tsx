import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { FilterMediaClasses } from "@storyteller/api";
import { useGalleryData } from "./useGalleryData";
import type { GalleryItem } from "./types";

const { list } = vi.hoisted(() => ({ list: vi.fn() }));
vi.mock("@storyteller/api", () => ({
  FilterMediaClasses: { IMAGE: "image", VIDEO: "video" },
  FilterMediaType: { SCENE_JSON: "scene_json" },
  GalleryModalApi: class { listUserMediaFiles = list; },
}));
vi.mock("@storyteller/common", () => ({
  getMediaThumbnail: () => null,
  getMediaStillThumbnail: () => null,
  THUMBNAIL_SIZES: { LARGE: 512 },
}));

const LOCAL: GalleryItem = {
  id: "local_file_image", label: "A sunset", thumbnail: "asset://localhost/image",
  fullImage: "asset://localhost/image", createdAt: "2026-11-01T00:00:00Z", mediaClass: "image",
};

afterEach(() => { cleanup(); list.mockReset(); });

it("shows signed-out local history and removes deleted local items", () => {
  const { result } = renderHook(() => useGalleryData({
    username: null, filterMediaClasses: [FilterMediaClasses.IMAGE], localItems: [LOCAL],
  }));
  expect(result.current.items).toEqual([LOCAL]);
  expect(result.current.isInitialLoading).toBe(false);
  expect(result.current.hasMore).toBe(false);
  expect(list).not.toHaveBeenCalled();
  act(() => result.current.removeItem(LOCAL.id));
  expect(result.current.items).toEqual([]);
});

it("keeps local images out of other media feeds", () => {
  const { result } = renderHook(() => useGalleryData({
    username: null, filterMediaClasses: [FilterMediaClasses.VIDEO], localItems: [LOCAL],
  }));
  expect(result.current.items).toEqual([]);
});

it("merges local history into cloud history in creation order", async () => {
  list.mockResolvedValue({ success: true, data: [{
    token: "m_new", media_class: "image", created_at: "2026-11-02T00:00:00Z",
  }], pagination: { current: 0, total_page_count: 1 } });
  const { result } = renderHook(() => useGalleryData({
    username: "artist", filterMediaClasses: [FilterMediaClasses.IMAGE], localItems: [LOCAL],
  }));
  await waitFor(() => expect(result.current.isInitialLoading).toBe(false));
  expect(result.current.items.map((item) => item.id)).toEqual(["m_new", LOCAL.id]);
});
